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
from functools import reduce
from fastapi import HTTPException
from typing import List, Dict, Union

import json
import re
from contextlib import suppress
from datetime import datetime, timezone

from motor.motor_asyncio import AsyncIOMotorDatabase

from .dto.Device import DeviceData, DeviceInfo
from .dto.DeviceConfiguration import (
    PrivateBackendConfiguration,
    QiskitConfiguration,
)
from .dto.FilteredDeviceData import (
    FilteredComponent,
    FilteredDeviceData,
)
from .dto.VisualisationType import VisualisationType
from .dto.Qiskit import QiskitDeviceData
from .utils.configuration_utils import (
    private_backend_config_to_qiskit_format,
)
from .utils.filtered_data_utils import (
    filter_device_data_by_type,
    join_filtered_device_data,
)
from .utils.qiskit_utils import device_data_to_qiskit
import websockets.client
from config import app_config

# DON NOT CHANGE THIS
DB_SORT_DESCENDING = -1
DB_SORT_ASCENDING = 1
WS_HOST = app_config["SERVER"]["WS_HOST"] + str(app_config["PORTS"]["WS_PORT"])

# To stop sending too much data. Will dump this amount of snapshots.
DB_SNAPSHOT_LIST_LENGTH = 100


# Call this event when fastapi starts. Currently not used.
async def on_startup() -> None:
    print("Service started up!")


async def get_backend_by_name_one(
    db: AsyncIOMotorDatabase, device_name: str, sort: int
) -> Union[DeviceData, None]:
    """
    Returns one snapshot from the database depending on the sort and the device name.
    include_id is used internally by mongoDB to index objects.
    """
    item = await _get_db_sorted_one(db, device_name=device_name, sort=sort)
    return DeviceData.parse_obj(item) if item else None


async def get_device_info(db: AsyncIOMotorDatabase, device_name) -> DeviceInfo:
    """
    Returns a DeviceInfo object with information about the specified device.
    """
    item = await _get_db_sorted_one(
        db, device_name=device_name, sort=DB_SORT_DESCENDING
    )

    if item is None:
        raise HTTPException(
            status_code=404,
            detail=f'No device "{device_name}" was found.',
        )

    is_online = await get_endpoint_online_status_by_name(device_name)
    item["is_online"] = is_online

    return DeviceInfo.parse_obj(item)


async def get_backend_online_date(
    db: AsyncIOMotorDatabase, device_name: str
) -> Union[datetime, None]:
    """
    Returns the date the backend was online.
    """
    item = await _get_db_sorted_one(
        db, device_name=device_name, sort=DB_SORT_DESCENDING
    )
    return item["online_date"] if item else None


async def get_backend_offline_date(
    db: AsyncIOMotorDatabase, device_name: str
) -> Union[datetime, None]:
    """
    Returns if the backend is offline, the date the backend was last queried by data_transfer.
    If backend is online, return None.
    """
    if await get_endpoint_online_status_by_name(device_name):
        raise HTTPException(status_code=400, detail="Backend is online")
    item = await _get_db_sorted_one(
        db, device_name=device_name, sort=DB_SORT_DESCENDING
    )
    return item["last_update_date"] if item else None


async def get_snapshot_backend_date_range(
    db: AsyncIOMotorDatabase,
    device_name: str,
    from_time: Union[datetime, str] = datetime.min,
    to_time: Union[datetime, str] = datetime.now(timezone.utc),
    include_id: bool = False,
) -> Union[List[DeviceData], None]:
    with suppress(ValueError):
        cursor = db.data.find(
            {
                "backend_name": re.compile(f"^{device_name}$", re.IGNORECASE),
                "last_update_date": {
                    "$gte": datetime.fromisoformat(from_time)
                    if isinstance(from_time, str)
                    else from_time,
                    "$lte": datetime.fromisoformat(to_time)
                    if isinstance(to_time, str)
                    else to_time,
                },
                "_force_refresh": False,
            },
            {"_id": include_id, "_force_refresh": False},
            sort=[("last_update_date", DB_SORT_ASCENDING)],
        )
        return [
            DeviceData.parse_obj(item)
            for item in await cursor.to_list(length=DB_SNAPSHOT_LIST_LENGTH)
        ]
    return None


async def get_all_latest_backends(db: AsyncIOMotorDatabase) -> List[DeviceData]:
    # Creates tasks for each query and then dispatches them at the same time.
    # May improve speed over sequential.
    tasks = (
        get_backend_by_name_one(db, device_name=name, sort=DB_SORT_DESCENDING)
        for name in await db.data.distinct("backend_name")
    )
    # Filters all falsy values: None, {}, and []... etc
    return list(filter(bool, await asyncio.gather(*tasks)))  # type:ignore


async def get_number_snapshots_backend(
    db: AsyncIOMotorDatabase,
    device_name: str,
    sort: int = DB_SORT_DESCENDING,
    number: int = DB_SNAPSHOT_LIST_LENGTH,
    include_id: bool = False,
) -> List[DeviceData]:
    cursor = db.data.find(
        {"backend_name": re.compile(f"^{device_name}$", re.IGNORECASE)},
        {"_id": include_id},
        sort=[("last_update_date", sort)],
    )
    return [DeviceData.parse_obj(item) for item in await cursor.to_list(length=number)]


async def get_properties_by_type(
    db: AsyncIOMotorDatabase, device_name: str, type: VisualisationType
):
    backend_snapshot = await get_backend_by_name_one(
        db, device_name=device_name, sort=DB_SORT_DESCENDING
    )

    if backend_snapshot is None:
        raise HTTPException(
            404,
            detail=f'No device "{device_name}" was found.',
        )

    return filter_device_data_by_type(backend_snapshot, type)


async def get_properties_by_type_and_period(
    db: AsyncIOMotorDatabase,
    device_name: str,
    type: VisualisationType,
    from_datetime: datetime,
    to_datetime: datetime,
) -> FilteredDeviceData:
    """
    Returns the properties of the specified backend filtered by type
    over a period of time.
    """
    backend_snapshots = await get_snapshot_backend_date_range(
        db,
        device_name=device_name,
        from_time=from_datetime,
        to_time=to_datetime,
    )

    if not backend_snapshots:
        raise HTTPException(
            404,
            detail=f'No data from a backend "{device_name}" was found from {str(from_datetime)} to {str(to_datetime)}.',
        )

    filtered_devices = map(
        lambda snapshot: filter_device_data_by_type(snapshot, type),
        backend_snapshots,
    )

    try:
        return reduce(join_filtered_device_data, list(filtered_devices))
    except ValueError:
        raise HTTPException(
            400, detail="The data from the specified time period could not be returned."
        )


async def get_property_over_time(
    db: AsyncIOMotorDatabase,
    device_name: str,
    components: str,
    property_name: str,
    from_datetime: datetime,
    to_datetime: datetime,
) -> Union[List[FilteredComponent], None]:
    """
    Returns all recorded values with the given property name for each of the specified
    components (qubits, gates, resonators or couplers) in the specified time period.
    """

    snapshot_range = await get_snapshot_backend_date_range(
        db, device_name=device_name, from_time=from_datetime, to_time=to_datetime
    )
    if snapshot_range is None or len(snapshot_range) == 0:
        raise HTTPException(
            404,
            detail=f'No data from a backend "{device_name}" was found from {str(from_datetime)} to {str(to_datetime)}.',
        )

    sample_snapshot = snapshot_range[0]

    try:
        backend_components = dict(sample_snapshot)[components]
    except KeyError:
        raise HTTPException(
            status_code=400,
            detail=f'"{components}" are not valid components. Valid components are qubits, couplers, resonators, and gates.',
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
                raise HTTPException(
                    status_code=400,
                    detail=f'Property "{property_name}" does not exist on the {components} of device {device_name}.',
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


async def get_latest_device_configuration_by_name(
    db: AsyncIOMotorDatabase, device_name: str
):
    """
    Returns the latest DeviceConfiguration of the specified device.
    """
    config = await _get_latest_config_by_name(db, device_name=device_name)

    if config is None:
        raise HTTPException(
            404, detail=f'No configuration file for a device "{device_name}" was found.'
        )

    return config


async def get_latest_qiskit_configuration_by_name(
    db: AsyncIOMotorDatabase,
    device_name: str,
) -> QiskitConfiguration:
    """
    Returns the latest configuration of the specified device in Qiskit format.
    """
    config = await _get_latest_config_by_name(db, device_name=device_name)

    if config is None:
        raise HTTPException(
            404, detail=f'No configuration file for a device "{device_name}" was found.'
        )

    try:
        qiskit_config = private_backend_config_to_qiskit_format(config)
    except ValueError:
        raise HTTPException(
            500,
            detail=f'The configuration of backend "{device_name}" could not be converted into Qiskit format.',
        )

    return qiskit_config


async def get_qiskit_device_data_by_name(
    db: AsyncIOMotorDatabase, device_name: str
) -> QiskitDeviceData:
    """
    Returns the latest snapshot of the specified device as QiskitDeviceData.
    """

    device = await _get_db_sorted_one(
        db, device_name=device_name, sort=DB_SORT_DESCENDING
    )

    if device is None:
        raise HTTPException(404, detail=f'No device "{device_name}" was found.')

    device_data = DeviceData.parse_obj(device)

    return device_data_to_qiskit(device_data)


async def _ws_service(command: str, value: Union[None, str] = None) -> dict:
    """
    Helper function to generalize connection with websocket server
    """
    async with websockets.client.connect(
        WS_HOST, timeout=app_config["TIMEOUTS"]["REQUEST_TIMEOUT"]
    ) as c:
        payload = json.dumps({"command": command, "value": value})
        await c.send(payload)
        return json.loads(await c.recv())


async def force_refresh(device_name: str) -> bool:
    """
    Helper function to get a force refresh for device. If endpoint is invalid, it sends "KO"
    Data is inserted to database.
    """
    data = await _ws_service("force_refresh", device_name)
    return data["response"] == "OK"


async def get_endpoint_online_status_by_name(device_name: str) -> bool:
    data = await _ws_service("get_endpoint_online_status_by_name", device_name)
    return data["data"]


async def get_all_endpoint_online_statuses() -> Dict[str, bool]:
    data = await _ws_service("get_all_endpoint_online_statuses")
    return data["data"]


async def _get_db_sorted_one(
    db: AsyncIOMotorDatabase, device_name: str, sort: int
) -> Union[dict, None]:
    """
    Returns one item from the database: The first or the last one depending on the sort.
    """
    filter_keys = {  # Delete these from object depending on bool-value.
        "_id": False,
        "_force_refresh": False,
    }
    return await db.data.find_one(
        {"backend_name": re.compile(f"^{device_name}$", re.IGNORECASE)},  # Get this
        filter_keys,
        sort=[("last_update_date", sort)],  # Sort by this.
    )


async def _get_latest_config_by_name(
    db: AsyncIOMotorDatabase,
    device_name: str,
) -> Union[PrivateBackendConfiguration, None]:
    """
    Returns the latest version of the configuration of the specified device.
    """
    config = await db.config.find_one(
        {"backend_name": device_name},
        {"_id": False},
        sort=[("backend_version", DB_SORT_DESCENDING)],
    )

    return PrivateBackendConfiguration.parse_obj(config)
