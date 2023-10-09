# This code is part of Tergite
#
# (C) Copyright Simon Genne, Arvid Holmqvist, Bashar Oumari, Jakob Ristner,
#               Björn Rosengren, and Jakob Wik 2022 (BSc project)
# (C) Copyright Fabian Forslund, Nicklas Botö 2022
# (C) Copyright Abdullah-Al Amin 2022
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.


import argparse
import asyncio
import functools
import json
import logging
import re
from contextlib import suppress
from datetime import datetime
from typing import Union

import aiohttp
from motor.motor_asyncio import AsyncIOMotorClient as MotorClient
from motor.motor_asyncio import AsyncIOMotorCollection as MotorCollection
from websockets.server import WebSocketServerProtocol
from websockets.server import serve as WebSocketServer

from config import app_config
from settings import DB_MACHINE_ROOT_URL, DB_NAME


async def main():
    print("Starting Web-Socket Server")
    # Get polling time, and fileargs sets logging level.
    time_num = _get_polling_time(_parse_fileargs().time)

    print("Starting DATA TRANSFER")
    loop = asyncio.get_event_loop()

    # MongoDB Setup.
    mongodb_uri = str(DB_MACHINE_ROOT_URL)
    db_name = str(DB_NAME)
    db_data_collection = "data"
    db_config_collection = "config"

    print("Running MOTOR CLIENT")
    db_client = MotorClient(mongodb_uri, io_loop=loop)
    data_collection = db_client[db_name][db_data_collection]
    config_collection = db_client[db_name][db_config_collection]

    # Get the endpoints dict
    endpoints = app_config["ENDPOINTS_URL"]
    print(f"Available endpoints: {endpoints}")
    print("Starting polling and ws server task")
    polling_task = loop.create_task(
        polling(
            time_num,
            data_collection,
            config_collection,
            endpoints,
        )
    )
    ws_server_task = loop.create_task(
        ws_server(
            app_config["PORTS"]["WS_PORT"],
            data_collection,
            endpoints,
        )
    )

    await polling_task
    await ws_server_task

    try:
        loop.run_forever()
    except KeyboardInterrupt:
        pass
    finally:
        loop.close()
    print("DATA TRANSFER STOPPED")


# poling to get data from bcc
async def polling(
    poll_time: Union[float, int],
    db_data_collection: MotorCollection,
    db_config_collection: MotorCollection,
    endpoints: dict,
):
    print("Polling Started")

    async def _query_insert(addr: str) -> None:
        js_object = await _fetch_data(addr)
        if js_object is not None:
            await _insert_data(db_data_collection, js_object, False)

    for host_addr in endpoints.values():
        config_addr = host_addr + app_config["REST_API_MAP"]["device_config"]
        config = await _fetch_data(config_addr)
        if config is not None:
            await _insert_config(db_config_collection, config)

    while True:
        for host_addr in endpoints.values():
            asyncio.create_task(
                _query_insert(host_addr + app_config["REST_API_MAP"]["web-gui"])
            )
        await asyncio.sleep(poll_time)


async def ws_server(
    socket_port: int, db_data_collection: MotorCollection, endpoints: dict
):
    """WebSocket Server for handling simple requests
    as a funnel for data between private api <-> public api.
    """
    partial = functools.partial(
        _ws_handler, db_data_collection=db_data_collection, endpoints=endpoints
    )
    print("WS_SERVER Started")
    async with WebSocketServer(partial, "", socket_port) as srv:
        await srv.serve_forever()


async def _ws_handler(
    client: WebSocketServerProtocol,
    db_data_collection: MotorCollection,
    endpoints: dict,
):
    """
    Should be serialized json object.
        command: The command
        value: Optional, for example getting a specific endpoint

    Commands:
        force_refresh -- Tries to get the latest data from the chosen endpoint.
        get_endpoint_dict -- Sends back a dict with all endpoint names and its addresses.
        reload_endpoints_dict -- Reloads and returns the updated dict with addresses

        get_all_endpoint_online_statuses -- Returns a dict with all endpoint names and its online statuses.
        get_endpoint_online_status_by_name -- Returns endpoint online status by name

    Returns serialized json object with the keys:
        response: "OK" | "KO"
        data: Optional

    If bad command, returns "KO" as response
    """
    msg = await client.recv()
    return_data = False
    if isinstance(msg, str):
        with suppress(Exception):
            payload = json.loads(msg)
            value: Union[str, None] = payload.get("value")
            cmd = payload["command"].lower()
            if cmd == "get_endpoints_dict":
                return_data = endpoints
            elif cmd == "force_refresh":
                if value:
                    endpoint_addr: Union[str, None] = endpoints.get(value)
                    if endpoint_addr is not None:
                        data = await _fetch_data(endpoint_addr)
                        if data is not None:
                            await _insert_data(db_data_collection, data, True)
                            return_data = None
            elif cmd == "reload_endpoints_file":
                endpoints.clear()
                endpoints.update(app_config["ENDPOINTS_URL"])
                return_data = endpoints
            elif cmd == "get_endpoint_online_status_by_name":
                if value:
                    return_data = await _get_endpoint_online_status_by_address(
                        endpoints.get(value.lower())
                    )
            elif cmd == "get_all_endpoint_online_statuses":
                tasks = (
                    _get_endpoint_online_status_by_address(addr)
                    for addr in endpoints.values()
                )
                return_data = dict(zip(endpoints, await asyncio.gather(*tasks)))
    if return_data is False:  # None is a valid value, false is not.
        reply_msg = {"response": "KO", "data": "Invalid command"}
    else:
        reply_msg = {"response": "OK", "data": return_data}
    await client.send(json.dumps(reply_msg))


async def _get_endpoint_online_status_by_address(address: str) -> bool:
    if address is not None:
        with suppress(
            asyncio.exceptions.TimeoutError,
            aiohttp.ClientConnectorSSLError,
            aiohttp.ClientConnectorError,
        ):
            timeout = aiohttp.ClientTimeout(total=2)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.get(address) as resp:
                    return 200 <= resp.status < 300
    return False


async def _fetch_data(address: str) -> Union[None, dict]:
    try:
        timeout = aiohttp.ClientTimeout(
            total=app_config["TIMEOUTS"]["ENDPOINT_FETCH_TIMEOUT"]
        )
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(address) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    if isinstance(data, dict):
                        return data
    # If too long delay
    except asyncio.exceptions.TimeoutError:
        # TODO Logging?
        pass
    # If SSL/HTTPS or HTTP link is broken
    except (aiohttp.ClientConnectorSSLError, aiohttp.ClientConnectorError):
        pass
    return None


async def _insert_data(
    db_data_collection: MotorCollection, js_object: dict, forced=False
) -> None:
    # Don't insert the object into the DB if it already exist.
    js_object["last_update_date"] = datetime.fromisoformat(
        js_object["last_update_date"]
    )
    js_object["online_date"] = datetime.fromisoformat(js_object["online_date"])
    js_object.update({"_force_refresh": forced})
    if (
        await db_data_collection.find_one(
            {"last_update_date": js_object["last_update_date"]}
        )
        is None
    ):
        await db_data_collection.insert_one(js_object)


async def _insert_config(db_config_collection: MotorCollection, config: dict):
    existing_config = await db_config_collection.find_one(
        {
            "backend_name": config["backend_name"],
            "backend_version": config["backend_version"],
        }
    )

    if existing_config is None:
        db_config_collection.insert_one(config)


def _read_endpoints_json_file(path_file: str) -> dict:
    # Reads endpoints.json, if http is missing from value, add it.
    with open(path_file) as f:
        raw_data = json.load(f)
    data = {}
    backend_name: str
    backend_addr: str
    http_ic = re.compile("^(http://)", re.IGNORECASE)
    for backend_name, backend_addr in raw_data.items():
        # If https:// assume everything is alright.
        if backend_addr.lower().startswith("https://"):
            value = backend_addr
        else:  # Addresses are either schemaless or http:// here
            removed_schema = http_ic.sub("", backend_addr, 1)
            authority = removed_schema.split("/", maxsplit=1)[0]
            if authority.endswith(":443"):
                value = "https://"
            else:
                # Find original http:
                found = http_ic.search(backend_addr)
                if found:
                    index = found.span()[1]
                    value = backend_addr[:index]
                else:
                    value = "http://"
            value += removed_schema
        data[backend_name.lower()] = value
    return data


def _get_polling_time(time: str) -> float:
    value = float(time[:-1]) * 60 if time[-1] == "m" else float(time)
    if value <= 0:
        raise ValueError("Time can't be 0 or less")
    return value


def _parse_fileargs() -> argparse.Namespace:
    # Logging level
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "-v",
        "--verbose",
        help="Be verbose",
        action="store_const",
        dest="loglevel",
        default=logging.WARNING,
        const=logging.INFO,
    )
    parser.add_argument(
        "--time",
        help="Default seconds, add m to value to change to minutes, 5m",
        default=str(60 * 5),
        type=str,
    )
    args = parser.parse_args()
    logging.basicConfig(level=args.loglevel)
    return args


loop = asyncio.get_event_loop()
loop.run_until_complete(main())
