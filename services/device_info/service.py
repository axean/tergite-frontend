# This code is part of Tergite
#
# (C) Copyright Simon Genne, Arvid Holmqvist, Bashar Oumari, Jakob Ristner,
#               Björn Rosengren, and Jakob Wik 2022 (BSc project)
# (C) Copyright Abdullah-Al Amin 2022
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.

import asyncio
import re
from contextlib import suppress
from datetime import datetime, timezone
from functools import reduce
from typing import Any, Dict, List, Union

import aiohttp
from motor.motor_asyncio import AsyncIOMotorCollection as MotorCollection
from motor.motor_asyncio import AsyncIOMotorDatabase

from utils import mongodb as mongodb_utils
from utils.date_time import parse_datetime_string

from .config import app_config
from .dtos import (
    BasicDeviceConfig,
    BasicDeviceData,
    DeviceData,
    FilteredComponent,
    FilteredDeviceData,
    PrivateBackendFullDeviceConfig,
    Property,
    QiskitDeviceData,
    QiskitFullDeviceConfig,
    VisualisationType,
)
from .utils.configs import to_qiskit_config_format
from .utils.filtered_data import filter_device_data_by_type, join_filtered_device_data
from .utils.http import fetch_data
from .utils.qiskit import to_qiskit_device_data

# DO NOT CHANGE THIS
_DB_SORT_DESCENDING = -1
_DB_SORT_ASCENDING = 1

# To stop sending too much data. Will dump this amount of snapshots.
_DB_SNAPSHOT_LIST_LENGTH = 100

_DEVICE_ENDPOINTS = app_config["ENDPOINTS_URL"]


async def on_startup() -> None:
    """Call this event when fastapi starts. Currently not used."""
    print("Service started up!")


async def get_all_backends(db: AsyncIOMotorDatabase):
    """Gets all backends in the backend collection

    Args:
        db: the mongo database from which to get the databases

    Returns:
        a list of all backends found in the backend collection
    """
    return await mongodb_utils.find_all(
        db.backends, limit=-1, **mongodb_utils.LATEST_FIRST_SORT
    )


async def get_one_backend(db: AsyncIOMotorDatabase, name: str):
    """Gets the backend of the given name

    Args:
        db: the mongo database where the backend information is stored
        name: the name of the backend to return

    Returns:
        the backend as a dictionary
    """
    return await mongodb_utils.find_one(db.backends, {"name": name})


# FIXME: Create a standard schema for the given payload
async def create_backend(db: AsyncIOMotorDatabase, payload: Dict[str, Any]):
    """Creates a new backend from the payload passed

    Args:
        db: the mongo database where the backend information is stored
        payload: the backend dict

    Returns:
        the new backend

    Raises:
        ValueError: server failed to replace or insert document
    """
    return await mongodb_utils.insert_one_if_not_exists(
        db.backends, document=payload, unique_fields=("name",)
    )


async def get_all_basic_device_data(db: AsyncIOMotorDatabase) -> List[BasicDeviceData]:
    """Gets the Basic Device data for all devices

    Args:
        db: the mongo database from which to retrieve all data for the devices

    Returns:
        the list of basic device data for all unique devices
    """
    statuses = await get_all_backend_online_statuses()
    data = await get_all_latest_backends_data(db)
    return [
        BasicDeviceData(
            backend_name=item.backend_name,
            n_qubits=item.n_qubits,
            is_online=statuses[item.backend_name.lower()],
            last_update_date=item.last_update_date,
            backend_version=item.backend_version,
            online_date=item.online_date,
            sample_name=item.sample_name,
        )
        for item in data
    ]


async def get_device_data(db: AsyncIOMotorDatabase, device: str) -> DeviceData:
    """Retrieves the static and dynamic properties of a specified backend.

    Args:
        db: the mongo database from which to retrieve all data for the devices
        device: the name of the device/backend

    Returns:
        the properties of the device/backend

    Raises:
        DocumentNotFoundError: no documents matching the filter '{_filter}' were found in the 'data' collection
    """
    data = await _get_latest_device_data(db, device_name=device)
    return DeviceData.parse_obj(data)


async def get_device_info(db: AsyncIOMotorDatabase, device_name) -> BasicDeviceConfig:
    """Retrieves a BasicDeviceConfig object with information about the specified device.

    Args:
        db: the mongo database from which to retrieve all data for the devices
        device_name: the name of the device/backend

    Returns:
        the basic config properties of the device/backend

    Raises:
        DocumentNotFoundError: no documents matching the filter '{_filter}' were found in the 'data' collection
    """
    item = await _get_latest_device_data(db, device_name=device_name)
    item["is_online"] = await is_device_online(device_name)
    return BasicDeviceConfig.parse_obj(item)


async def get_backend_online_date(
    db: AsyncIOMotorDatabase, device_name: str
) -> datetime:
    """Retrieves the datetime from which the backend has been online.

    Args:
        db: the mongo database from which to retrieve all data for the devices
        device_name: the name of the device

    Returns:
        the datetime when the device was last online

    Raises:
        DocumentNotFoundError: no documents matching the filter '{_filter}' were found in the 'data' collection
    """
    item = await _get_latest_device_data(db, device_name=device_name)
    return item["online_date"]


async def get_backend_offline_date(
    db: AsyncIOMotorDatabase, device_name: str
) -> datetime:
    """Retrieves the datetime when the backend was last seen online

    Returns if the backend is offline, the date the backend was last queried by data_transfer.

    Args:
        db: the mongo database from which to retrieve all data for the devices
        device_name: the name of the backend/device

    Raises:
        ValueError: backend {device_name} is online

    Returns:
        the datetime when the backend was last seen online
    """
    if await is_device_online(device_name):
        raise ValueError("Backend is online")

    item = await _get_latest_device_data(db, device_name=device_name)
    return item["last_update_date"]


async def get_backend_data_snapshot(
    db: AsyncIOMotorDatabase,
    device_name: str,
    from_: datetime = datetime.min,
    to_: datetime = datetime.now(timezone.utc),
) -> List[DeviceData]:
    """Retrieves the data snapshot for the backend withing the given time range

    Args:
        db: the mongo database from which to retrieve all data for the devices
        device_name: the name of the device
        from_: the lower boundary of the time range
        to_: the upper boundary of the time range

    Returns:
        List of device data snapshots for the given backend

    Raises:
        ValueError: some value error when no data is got from mongodb
    """
    cursor = db.data.find(
        {
            "backend_name": re.compile(f"^{device_name}$", re.IGNORECASE),
            "last_update_date": {
                "$gte": from_,
                "$lte": to_,
            },
            "_force_refresh": False,
        },
        {"_id": False, "_force_refresh": False},
        sort=[("last_update_date", _DB_SORT_ASCENDING)],
    )
    items = await cursor.to_list(length=_DB_SNAPSHOT_LIST_LENGTH)
    return [DeviceData.parse_obj(item) for item in items]


async def get_all_latest_backends_data(db: AsyncIOMotorDatabase) -> List[DeviceData]:
    """Retrieves the latest data for all backends

    Args:
        db: the mongo database from which to retrieve all data for the devices

    Returns:
        a list of device data for all devices
    """
    # Creates tasks for each query and then dispatches them at the same time.
    # May improve speed over sequential.
    tasks = (
        get_device_data(db, device=name)
        for name in await db.data.distinct("backend_name")
    )
    # Filter out all DocumentNotFoundError errors
    return [  # type:ignore
        v
        for v in await asyncio.gather(*tasks, return_exceptions=True)
        if not isinstance(v, mongodb_utils.DocumentNotFoundError)
    ]


async def get_properties_by_type(
    db: AsyncIOMotorDatabase, device_name: str, type_: VisualisationType
):
    """Retrieves properties of the given VisualisationType from the latest data of the device

    Args:
        db: the mongo database from which to retrieve all data for the devices
        device_name: the name of the device
        type_: the type of visualization whose properties are to be returned

    Returns:
        the filtered data properties for the given type

    Raises:
        TypeError: invalid type "{type}". Valid types are {VisualisationType.values()}
        DocumentNotFoundError: no documents matching the filter '{_filter}' were found in the 'data' collection
    """
    backend_snapshot = await get_device_data(db, device=device_name)
    return filter_device_data_by_type(backend_snapshot, type_)


async def get_properties_by_type_and_period(
    db: AsyncIOMotorDatabase,
    device_name: str,
    type_: VisualisationType,
    from_: datetime,
    to_: datetime,
) -> FilteredDeviceData:
    """Retrieves the properties of the specified backend filtered by type
     over a period of time.

    Args:
         db: the mongo database from which to retrieve all data for the devices
         device_name: the name of the device
         type_: the type of visualization whose properties are to be returned
         from_: the lower boundary of the time range
         to_: the upper boundary of the time range

     Returns:
         the filtered data properties for the given type

     Raises:
         ValueError: some error when no data is got from mongodb
    """
    backend_snapshots = await get_backend_data_snapshot(
        db, device_name=device_name, from_=from_, to_=to_
    )

    filtered_devices = list(
        map(
            lambda snapshot: filter_device_data_by_type(snapshot, type_),
            backend_snapshots,
        )
    )

    return reduce(join_filtered_device_data, filtered_devices)


async def get_property_over_time(
    db: AsyncIOMotorDatabase,
    device_name: str,
    components: str,
    property_name: str,
    from_: datetime,
    to_: datetime,
) -> List[Dict[str, Union[List[Property], int]]]:
    """Retrieves all recorded values with the given property name for each of the
    components in the time period.

    Args:
        db: the mongo database from which to retrieve all data for the devices
        device_name: the name of the device
        components:  can be any of (qubits, gates, resonators or couplers)
        property_name: the name of the property whose values are to be returned
        from_: the lower boundary of the time range
        to_: the upper boundary of the time range

     Raises:
         TypeError: invalid type "{type}". Valid types are {VisualisationType.values()}
         TypeError: "{components}" are not valid components.
          Valid components are qubits, couplers, resonators, and gates.
         TypeError: property "{property_name}" does not exist on the {components} of device {device_name}.
         ValueError: some error when no data is got from mongodb
    """
    snapshot_range = await get_backend_data_snapshot(
        db, device_name=device_name, from_=from_, to_=to_
    )
    if len(snapshot_range) == 0:
        raise ValueError("no snapshots found")

    sample_snapshot = snapshot_range[0]

    try:
        backend_components = dict(sample_snapshot)[components]
    except KeyError:
        raise TypeError(
            (
                f'"{components}" are not valid components.'
                " Valid components are qubits, couplers, resonators, and gates."
            )
        )

    filtered_property_list = []

    # Outer loop iterates over the specified components (qubits, couplers, resonators or gates)
    # of the backend.
    for component in backend_components:
        filtered_component = {
            "id": component.id,
            property_name: [],
        }

        # Inner loop iterates over the backend snapshots in the specified time range.
        for snapshot in snapshot_range:
            # Get the current components object from the backend snapshot.
            snapshot_component = next(
                c for c in dict(snapshot)[components] if c.id == component.id
            )

            all_props = [
                *snapshot_component.dynamic_properties,
                *snapshot_component.static_properties,
            ]

            # Find the property of the current component whose name matches the
            # given property name.
            found_prop = next(
                (prop for prop in all_props if prop.name == property_name), None
            )
            if found_prop is None:
                raise TypeError(
                    (
                        f'property "{property_name}" does not exist on'
                        f" the {components} of device {device_name}."
                    )
                )

            # If a value with the same date (the same value) has already been added, then skip.
            if any(
                prev_value.date == found_prop.date
                for prev_value in filtered_component[property_name]
            ):
                continue

            filtered_component[property_name].append(found_prop)
        filtered_property_list.append(
            FilteredComponent.parse_obj(filtered_component).__root__
        )
    return filtered_property_list


async def get_latest_qiskit_config(
    db: AsyncIOMotorDatabase,
    device_name: str,
) -> QiskitFullDeviceConfig:
    """Retrieves the latest configuration of the specified device in Qiskit format.

    Args:
        db: the mongo database from which to retrieve all data for the devices
        device_name: the name of the device

    Returns:
        the config of the device in Qiskit format

    Raises:
        DocumentNotFoundError: no documents matching the filter '{_filter}' were found in the 'config' collection
        ValueError: f"No qubit with id {connected_qubit_id} was found."
    """
    device_config = await get_latest_device_config(db, device_name=device_name)
    return to_qiskit_config_format(device_config)


async def get_qiskit_device_data(
    db: AsyncIOMotorDatabase, device_name: str
) -> QiskitDeviceData:
    """Retrieves the latest snapshot of the specified device as QiskitDeviceData.

    Args:
        db: the mongo database from which to retrieve all data for the devices
        device_name: the name of the device

    Returns:
        the latest snapshot data of the device as QiskitDeviceData

    Raises:
        DocumentNotFoundError: no documents matching the filter '{_filter}' were found in the 'config' collection
    """

    device = await _get_latest_device_data(db, device_name=device_name)
    device_data = DeviceData.parse_obj(device)
    return to_qiskit_device_data(device_data)


async def force_refresh(db: AsyncIOMotorDatabase, device_name: str) -> bool:
    """Refreshes the data of the device by making a query to its backend

    Helper function to get a force refresh for device. If endpoint is invalid, it returns False
    Data is inserted to database.

    Args:
        db: the mongo database from which to retrieve all data for the devices
        device_name: the name of the device

    Returns:
        True if successful, False otherwise
    """
    try:
        endpoint_addr: str = _DEVICE_ENDPOINTS[device_name.lower()]
    except KeyError:
        return False

    if endpoint_addr is not None:
        data = await fetch_data(endpoint_addr)
        if data is not None:
            await insert_backend_data_in_db(db.data, data, True)

    return True


async def is_device_online(device_name: str) -> bool:
    """Checks if the device of device_name is online

    Args:
        device_name: the name of the device

    Returns:
        True if device is online, False otherwise
    """
    try:
        endpoint_addr: str = _DEVICE_ENDPOINTS[device_name.lower()]
    except KeyError:
        return False
    return await is_address_online(endpoint_addr)


async def get_all_backend_online_statuses() -> Dict[str, bool]:
    """Retrieves the online statuses of all backends

    Returns:
        a mapping of backend names and their online status
    """
    tasks = (is_address_online(addr) for addr in _DEVICE_ENDPOINTS.values())
    return dict(zip(_DEVICE_ENDPOINTS, await asyncio.gather(*tasks)))


async def is_address_online(address: str) -> bool:
    """Checks whether a given URL address is online

    Args:
        address: the URL address being checked

    Returns:
        True if it is online, False otherwise
    """
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


async def append_latest_device_info(
    db_data_collection: MotorCollection, host_address: str
) -> None:
    """Retrieves the latest device info of backend at given host_address and inserts it into the data collection

    Args:
        db_data_collection: the collection in mongo db that has data
        host_address: the URL address where the device is running
    """
    url = f'{host_address}{app_config["REST_API_MAP"]["web-gui"]}'
    response = await fetch_data(url)
    if response is not None:
        await insert_backend_data_in_db(db_data_collection, response, False)


async def append_latest_device_config(
    db_config_collection: MotorCollection, host_address: str
) -> None:
    """Retrieves the latest device config of backend at given host_address and inserts it into the config collection

    Args:
        db_config_collection: the collection in mongo db that has the configs
        host_address: the URL address where the device is running
    """
    config_addr = host_address + app_config["REST_API_MAP"]["device_config"]
    response = await fetch_data(config_addr)
    if response is not None:
        await _insert_config(db_config_collection, response)


async def insert_backend_data_in_db(
    db_data_collection: MotorCollection, payload: Dict[str, Any], forced=False
) -> None:
    """Inserts the payload into the collection if it's timestamp does not exist already

    Args:
        db_data_collection: the mongo db collection to insert into
        payload: the data to insert into the collection
        forced: whether the refresh is forced or not
    """
    # Don't insert the object into the DB if it already exist.
    payload["last_update_date"] = parse_datetime_string(payload["last_update_date"])
    payload["online_date"] = parse_datetime_string(payload["online_date"])
    payload.update({"_force_refresh": forced})
    await mongodb_utils.insert_one_if_not_exists(
        collection=db_data_collection,
        document=payload,
        unique_fields=("last_update_date",),
    )


async def _insert_config(
    db_config_collection: MotorCollection, _config: Dict[str, Any]
):
    """Inserts a config object into the config collection

    Args:
        db_config_collection: the mongo db collection to insert into
        _config: the config dictionary
    """
    existing_config = await db_config_collection.find_one(
        {
            "backend_name": _config["backend_name"],
            "backend_version": _config["backend_version"],
        }
    )

    if existing_config is None:
        db_config_collection.insert_one(_config)


async def get_latest_device_config(
    db: AsyncIOMotorDatabase,
    device_name: str,
) -> PrivateBackendFullDeviceConfig:
    """Returns the latest version of the configuration of the specified device.

    Args:
        db: the mongo database from which to retrieve all data for the devices
        device_name: the name of the device/backend

    Returns:
        the latest configuration for the specified device

    Raises:
        DocumentNotFoundError: no documents matching the filter '{_filter}' were found in the 'config' collection
    """
    result = await mongodb_utils.find_one(
        collection=db.config,
        _filter={"backend_name": device_name},
        dropped_fields=("_id",),
        sorted_by=[("backend_version", _DB_SORT_DESCENDING)],
    )

    return PrivateBackendFullDeviceConfig.parse_obj(result)


async def _get_latest_device_data(
    db: AsyncIOMotorDatabase, device_name: str
) -> Dict[str, Any]:
    """Retrieves the altest device data from the database

    Args:
        db: the mongo database from which to retrieve all data for the devices
        device_name: name of the device whose data is to be fetched

    Returns:
        the latest data for the specified device

    Raises:
        DocumentNotFoundError: no documents matching the filter '{_filter}' were found in the 'data' collection
    """
    return await mongodb_utils.find_one(
        collection=db.data,
        _filter={"backend_name": re.compile(f"^{device_name}$", re.IGNORECASE)},
        dropped_fields=("_id", "_force_refresh"),
        sorted_by=[("last_update_date", _DB_SORT_DESCENDING)],
    )


async def patch_backend(db: AsyncIOMotorDatabase, name: str, payload: Dict[str, Any]):
    """Patches the backend data for the given backend

    Args:
        db: the mongo database from where to get the job
        name: the name of the backend
        payload: the new data to patch into the backend data

    Returns:
        the number of documents that were modified

    Raises:
        ValueError: server failed updating documents
        DocumentNotFoundError: no documents matching {"name": name} were found
    """
    return await mongodb_utils.update_many(
        db.backends,
        _filter={"name": str(name)},
        payload=payload,
    )
