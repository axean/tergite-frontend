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


from datetime import datetime, timezone
from typing import List, Dict, Union
from fastapi import APIRouter, HTTPException, Query
from api.dto.Qiskit import QiskitDeviceData
from api.dto.DeviceConfiguration import PrivateBackendConfiguration, QiskitConfiguration
from api.utils.datetime_utils import parse_datetime_string
from api.dto.FilteredDeviceData import FilteredComponent, FilteredDeviceData
from api.dto.Device import DeviceData, DeviceInfo, DevicesSimpleInfo
from api.dto.VisualisationType import VisualisationType
from api.services import service
from deps import MongoDbDep

router = APIRouter(prefix="/devices", tags=["devices"])

FROM_DATETIME = datetime(2000, 1, 1, tzinfo=timezone.utc)


@router.get("/", response_model=List[DevicesSimpleInfo])
async def all_endpoints_simple(db: MongoDbDep):
    """
    Returns simple overall data for all endpoints.
    """
    statuses = await service.get_all_endpoint_online_statuses()
    return [
        {
            "backend_name": item.backend_name,
            "n_qubits": item.n_qubits,
            "is_online": statuses[item.backend_name.lower()],
            "last_update_date": item.last_update_date,
            "backend_version": item.backend_version,
            "online_date": item.online_date,
            "sample_name": item.sample_name,
        }
        for item in await service.get_all_latest_backends(db)
    ]


@router.get("/all_last_data", response_model=List[DeviceData])
async def root(db: MongoDbDep):
    """
    Returns the static and dynamic properties of all available backends.
    """
    print("GOT DEVICES/ALL_LAST_DATA")
    return await service.get_all_latest_backends(db)


@router.get("/online_statuses", response_model=Dict[str, bool])
async def get_all_device_statuses():
    """
    Returns endpoints online statuses.
    """
    print("GOT_DEVICES/ONLINE_STATUSES")
    return await service.get_all_endpoint_online_statuses()


@router.get("/{device}", response_model=DeviceInfo)
async def get_device_info(db: MongoDbDep, device: str):
    """
    Returns configuration information from the specified backend.
    """
    return await service.get_device_info(db, device_name=device)


@router.get("/{device}/data", response_model=DeviceData)
async def get_device_data(
    db: MongoDbDep,
    device: str,
    force_refresh: bool = False,
):
    """
    Returns the static and dynamic properties of a specified backend.
    """
    if force_refresh:
        await service.force_refresh(device)
    data = await service.get_backend_by_name_one(
        db, device_name=device, sort=service.DB_SORT_DESCENDING
    )
    if data is None:
        raise HTTPException(status_code=404, detail=f"Device name {device} not found")
    return DeviceData.parse_obj(data)


@router.get("/{device}/data/qiskit", response_model=QiskitDeviceData)
async def get_qiskit_device_data(
    db: MongoDbDep, device: str, force_refresh: bool = False
):
    """
    Returns the stored data from the specified device in Qiskit format.
    """
    if force_refresh:
        await service.force_refresh(device)
    return await service.get_qiskit_device_data_by_name(db, device_name=device)


@router.get("/{device}/config", response_model=PrivateBackendConfiguration)
async def get_config(db: MongoDbDep, device: str):
    """
    Returns the configuration file of the specified backend.
    """
    return await service.get_latest_device_configuration_by_name(db, device_name=device)


@router.get("/{device}/config/qiskit", response_model=QiskitConfiguration)
async def get_qiskit_config(db: MongoDbDep, device: str):
    """
    Returns the configuration file of the specified backend in Qiskit format.
    """
    return await service.get_latest_qiskit_configuration_by_name(db, device_name=device)


@router.get("/{device}/online_since", response_model=datetime)
async def get_device_online_since_date(db: MongoDbDep, device: str):
    """
    Returns endpoint online status.
    """
    item = await service.get_backend_online_date(db, device_name=device)
    if item is None:
        raise HTTPException(
            status_code=404, detail=f"Device name {device} doesn't exist"
        )
    return item


@router.get("/{device}/offline_since", response_model=datetime)
async def get_device_offline_since_date(db: MongoDbDep, device: str):
    """
    Returns when the endpoint was last seen if offline.
    """
    item = await service.get_backend_offline_date(db, device_name=device)
    if item is None:
        raise HTTPException(
            status_code=404, detail=f"Device name {device} doesn't exist"
        )
    return item


@router.get("/{device}/online_status", response_model=bool)
async def get_device_status(device: str):
    """
    Returns endpoint online status.
    """
    return await service.get_endpoint_online_status_by_name(device)


@router.get("/{device}/{type}/period", response_model=FilteredDeviceData)
async def get_properties_by_type_and_period(
    db: MongoDbDep,
    device: str,
    type: str,
    _from: str = Query(None, alias="from"),
    to: Union[str, None] = None,
):
    """
    Returns all recorded values of all properties of a specified type
    over a range of time. The following query parameters can be used
    to specify the time interval from which the values will be collected.

    - **to**: An ISO formatted datetime string containing the latest allowed date
     of a value in the returned range. Will be replaced with the current time if
     omitted.
    - **from**: An ISO formatted datetime string containing the earliest allowed date
     of a value in the returned range. Will be replaced with 0001-01-01T00:00:00 if
     omitted.
    """

    from_datetime = FROM_DATETIME if _from is None else parse_datetime_string(_from)
    to_datetime = (
        datetime.now(timezone.utc) if to is None else parse_datetime_string(to)
    )

    if type not in VisualisationType.values():
        raise HTTPException(
            status_code=400,
            detail=f'Invalid type "{str(type)}". Valid types are {str(VisualisationType.values())}',
        )
    return await service.get_properties_by_type_and_period(
        db,
        device_name=device,
        type=VisualisationType(type),
        from_datetime=from_datetime,
        to_datetime=to_datetime,
    )


@router.get("/{device}/period", response_model=List[DeviceData])
async def get_backend_over_time(
    db: MongoDbDep,
    device: str,
    _from: str = Query(None, alias="from"),
    to: Union[str, None] = None,
):
    """
    Returns all recorded snapshots of a given backend over a range of time.
    The following query parameters can be used to specify the time interval
    from which the snapshots will be collected:

    - **to**: An ISO formatted datetime string containing the latest allowed date
     of a value in the returned range. Will be replaced with the current time if
     omitted.
    - **from**: An ISO formatted datetime string containing the earliest allowed date
     of a value in the returned range. Will be replaced with 0001-01-01T00:00:00 if
     omitted.
    """

    from_datetime = FROM_DATETIME if _from is None else parse_datetime_string(_from)
    to_datetime = (
        datetime.now(timezone.utc) if to is None else parse_datetime_string(to)
    )

    if from_datetime >= to_datetime:
        raise HTTPException(
            status_code=400,
            detail=f"The 'from' parameter must be before the 'to' parameter.",
        )

    snapshots = await service.get_snapshot_backend_date_range(
        db,
        device_name=device,
        from_time=from_datetime,
        to_time=to_datetime,
        include_id=False,
    )

    if not snapshots:
        raise HTTPException(
            status_code=404,
            detail=f'No data from a backend "{device}" was found from {from_datetime.isoformat()} to {to_datetime.isoformat()}.',
        )

    return snapshots


@router.get("/{device}/{type}", response_model=FilteredDeviceData)
async def get_properties_by_type(db: MongoDbDep, device: str, type: str):
    """
    Returns the properties of the specified backend's latest snapshot with the given
    type.
    """
    if type not in VisualisationType.values():
        raise HTTPException(
            status_code=400,
            detail=f'Invalid type "{str(type)}". Valid types are {str(VisualisationType.values())}',
        )
    return await service.get_properties_by_type(
        db, device_name=device, type=VisualisationType(type)
    )


@router.get(
    "/{device}/{components}/{property}/period",
    response_model=List[FilteredComponent],
)
async def get_property_over_time(
    db: MongoDbDep,
    device: str,
    components: str,
    property: str,
    # To get query param "from" even though it is a reserved word in Python.
    _from: str = Query(None, alias="from"),
    to: Union[str, None] = None,
):
    """
    Returns all recorded values of a given property over a range of time.
    The following query parameters can be used to specify the time interval
    from which the values will be collected:

    - **to**: An ISO formatted datetime string containing the latest allowed date
     of a value in the returned range. Will be replaced with the current time if
     omitted.
    - **from**: An ISO formatted datetime string containing the earliest allowed date
     of a value in the returned range. Will be replaced with 0001-01-01T00:00:00 if
     omitted.
    """
    from_datetime = FROM_DATETIME if _from is None else parse_datetime_string(_from)
    to_datetime = (
        datetime.now(timezone.utc) if to is None else parse_datetime_string(to)
    )

    if from_datetime >= to_datetime:
        raise HTTPException(
            status_code=400,
            detail=f"The 'from' parameter must be before the 'to' parameter.",
        )

    property_ranges = await service.get_property_over_time(
        db,
        device_name=device,
        components=components,
        property_name=property,
        from_datetime=from_datetime,
        to_datetime=to_datetime,
    )

    if not property_ranges:
        raise HTTPException(
            status_code=404,
            detail=f'No data from a backend "{device}" was found from {str(from_datetime)} to {str(to_datetime)}.',
        )

    return property_ranges
