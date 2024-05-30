# This code is part of Tergite
#
# (C) Copyright Simon Genne, Arvid Holmqvist, Bashar Oumari, Jakob Ristner,
#               Björn Rosengren, and Jakob Wik 2022 (BSc project)
# (C) Copyright Fabian Forslund, Niklas Botö 2022
# (C) Copyright Abdullah-Al Amin 2022
# (C) Copyright Martin Ahindura 2023
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
import asyncio
import functools
import json
from contextlib import suppress
from typing import Union

from motor.motor_asyncio import AsyncIOMotorClient as MotorClient
from motor.motor_asyncio import AsyncIOMotorCollection as MotorCollection
from websockets.server import WebSocketServerProtocol
from websockets.server import serve as WebSocketServer

import settings
from api.ws.utils import get_polling_time, parse_fileargs
from services.device_info import (
    append_latest_device_config,
    append_latest_device_info,
    fetch_data,
    insert_backend_data_in_db,
    is_address_online,
)
from services.device_info.config import app_config


async def main():
    print("Starting Web-Socket Server")
    # Get polling time, and fileargs sets logging level.
    time_num = get_polling_time(parse_fileargs().time)

    print("Starting DATA TRANSFER")
    loop = asyncio.get_event_loop()

    # MongoDB Setup.
    mongodb_uri = str(settings.CONFIG.database.url)
    db_name = str(settings.CONFIG.database.name)
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
        _append_all_latest_device_info_repeatedly(
            time_num, data_collection, config_collection, endpoints
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


async def _append_all_latest_device_info_repeatedly(
    poll_time: Union[float, int],
    db_data_collection: MotorCollection,
    db_config_collection: MotorCollection,
    endpoints: dict,
):
    """Repeatedly pull latest device data from bcc"""
    print("Polling Started")

    for host_addr in endpoints.values():
        await append_latest_device_config(db_config_collection, host_address=host_addr)

    while True:
        for host_addr in endpoints.values():
            asyncio.create_task(
                append_latest_device_info(db_data_collection, host_address=host_addr)
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
                        data = await fetch_data(endpoint_addr)
                        if data is not None:
                            await insert_backend_data_in_db(
                                db_data_collection, data, True
                            )
                            return_data = None
            elif cmd == "reload_endpoints_file":
                endpoints.clear()
                endpoints.update(app_config["ENDPOINTS_URL"])
                return_data = endpoints
            elif cmd == "get_endpoint_online_status_by_name":
                if value:
                    return_data = await is_address_online(endpoints.get(value.lower()))
            elif cmd == "get_all_endpoint_online_statuses":
                tasks = (is_address_online(addr) for addr in endpoints.values())
                return_data = dict(zip(endpoints, await asyncio.gather(*tasks)))
    if return_data is False:  # None is a valid value, false is not.
        reply_msg = {"response": "KO", "data": "Invalid command"}
    else:
        reply_msg = {"response": "OK", "data": return_data}
    await client.send(json.dumps(reply_msg))
