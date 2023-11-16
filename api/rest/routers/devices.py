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
#
# Refactored by Martin Ahindura - 2023-11-08


import logging
from datetime import datetime
from typing import Any, Dict, List, Union

from fastapi import APIRouter, HTTPException, Query, status

from api.rest.dependencies import MongoDbDep
from services import device_info
from services.device_info.dtos import (
    BasicDeviceConfig,
    BasicDeviceData,
    DeviceData,
    FilteredComponent,
    FilteredDeviceData,
    PrivateBackendFullDeviceConfig,
    QiskitDeviceData,
    QiskitFullDeviceConfig,
    VisualisationType,
)
from utils import mongodb as mongodb_utils
from utils.date_time import DEFAULT_FROM_DATETIME_STR, parse_datetime_string

# FIXME: These two routers seem to be for the same purpose i.e. store and retrieve info about devices/backends
#  but for backward compatibility (external code depends on both), they are both here.
devices_router = APIRouter(prefix="/devices", tags=["devices"])
backends_router = APIRouter(prefix="/backends", tags=["backends"])


@backends_router.get("")
async def read_backends(db: MongoDbDep):
    """Retrieves all backends"""
    return await device_info.get_all_backends(db)


@backends_router.get("/{name}")
async def read_backend(db: MongoDbDep, name: str):
    try:
        return await device_info.get_one_backend(db, name=name)
    except mongodb_utils.DocumentNotFoundError as exp:
        logging.error(exp)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"{name} not found"
        )


# FIXME: This should probably be a POST not a PUT because this is a `CREATE`
@backends_router.put("")
async def create_backend(db: MongoDbDep, payload: Dict[str, Any]):
    """Creates a new backend if it does not exist already"""
    try:
        await device_info.create_backend(db, payload=payload)
    except ValueError as exp:
        logging.error(exp)

    return "OK"


@backends_router.get("/{name}/properties/lda_parameters")
async def read_lda_parameters(db: MongoDbDep, name: str):
    try:
        document = await device_info.get_one_backend(db, name=name)
        lda_parameters = document["properties"]["lda_parameters"]
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"backend {name} lacks lda_parameters",
        )

    return lda_parameters


@backends_router.put("/{name}/properties/lda_parameters")
async def update_lda_parameters(db: MongoDbDep, name: str, lda_parameters: dict):
    try:
        await device_info.patch_backend(
            db, name, payload={"properties": {"lda_parameters": lda_parameters}}
        )
    except ValueError as exp:
        logging.error(exp)

    return "OK"


@devices_router.get("/", response_model=List[BasicDeviceData])
async def get_all_basic_device_data(db: MongoDbDep):
    """Gets the basic summarized data for all backends."""
    return await device_info.get_all_basic_device_data(db)


@devices_router.get("/all_last_data", response_model=List[DeviceData])
async def get_all_latest_backend_data(db: MongoDbDep):
    """Gets the static and dynamic properties of all available backends."""
    return await device_info.get_all_latest_backends_data(db)


@devices_router.get("/online_statuses", response_model=Dict[str, bool])
async def get_all_device_statuses():
    """Retrieves the online statuses of all devices"""
    return await device_info.get_all_backend_online_statuses()


@devices_router.get("/{device}", response_model=BasicDeviceConfig)
async def get_single_device_info(db: MongoDbDep, device: str):
    """Gets the basic configuration information from the specified backend."""
    try:
        return await device_info.get_device_info(db, device_name=device)
    except mongodb_utils.DocumentNotFoundError as exp:
        logging.error(exp)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'no device "{device}" was found.',
        )


@devices_router.get("/{device}/data", response_model=DeviceData)
async def get_single_device_data(
    db: MongoDbDep, device: str, force_refresh: bool = False
):
    """Retrieves the static and dynamic properties data of a specified backend."""
    if force_refresh:
        await device_info.force_refresh(db, device_name=device)

    try:
        return await device_info.get_device_data(db, device=device)
    except mongodb_utils.DocumentNotFoundError as exp:
        logging.error(exp)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device name {device} not found",
        )


@devices_router.get("/{device}/data/qiskit", response_model=QiskitDeviceData)
async def get_qiskit_device_data(
    db: MongoDbDep, device: str, force_refresh: bool = False
):
    """
    Returns the stored data from the specified device in Qiskit format.
    """
    if force_refresh:
        await device_info.force_refresh(db, device_name=device)

    try:
        return await device_info.get_qiskit_device_data(db, device_name=device)
    except mongodb_utils.DocumentNotFoundError as exp:
        logging.error(exp)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device name {device} not found",
        )


@devices_router.get("/{device}/config", response_model=PrivateBackendFullDeviceConfig)
async def get_config(db: MongoDbDep, device: str):
    """
    Returns the configuration file of the specified backend.
    """
    try:
        return await device_info.get_latest_device_config(db, device_name=device)
    except mongodb_utils.DocumentNotFoundError as exp:
        logging.error(exp)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'no configuration file for a device "{device}" was found',
        )


@devices_router.get("/{device}/config/qiskit", response_model=QiskitFullDeviceConfig)
async def get_qiskit_config(db: MongoDbDep, device: str):
    """
    Returns the configuration file of the specified backend in Qiskit format.
    """
    try:
        return await device_info.get_latest_qiskit_config(db, device_name=device)
    except mongodb_utils.DocumentNotFoundError as exp:
        logging.error(exp)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f'no configuration file for a device "{device}" was found.',
        )
    except ValueError as exp:
        logging.error(exp)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f'the configuration of backend "{device}" could not be converted into Qiskit format.',
        )


@devices_router.get("/{device}/online_since", response_model=datetime)
async def get_device_online_since_date(db: MongoDbDep, device: str):
    """Retrieves datetime from which the backend has been online."""
    try:
        return await device_info.get_backend_online_date(db, device_name=device)
    except mongodb_utils.DocumentNotFoundError as exp:
        logging.error(exp)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device name {device} doesn't exist",
        )


@devices_router.get("/{device}/offline_since", response_model=datetime)
async def get_device_offline_since_date(db: MongoDbDep, device: str):
    """Retrieves the datetime when the backend was last seen if offline."""
    try:
        return await device_info.get_backend_offline_date(db, device_name=device)
    except mongodb_utils.DocumentNotFoundError as exp:
        logging.error(exp)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device name {device} doesn't exist",
        )
    except ValueError as exp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{exp}")


@devices_router.get("/{device}/online_status", response_model=bool)
async def get_device_status(device: str):
    """
    Returns endpoint online status.
    """
    return await device_info.is_device_online(device)


@devices_router.get("/{device}/{type}/period", response_model=FilteredDeviceData)
async def get_properties_by_type_and_period(
    db: MongoDbDep,
    device: str,
    type: str,
    _from: str = Query(DEFAULT_FROM_DATETIME_STR, alias="from"),
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

    from_datetime = parse_datetime_string(_from)
    to_datetime = parse_datetime_string(to)

    if type not in VisualisationType.values():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'Invalid type "{str(type)}". Valid types are {str(VisualisationType.values())}',
        )

    if from_datetime >= to_datetime:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The 'from' parameter must be before the 'to' parameter.",
        )

    try:
        return await device_info.get_properties_by_type_and_period(
            db,
            device_name=device,
            type_=VisualisationType(type),
            from_=from_datetime,
            to_=to_datetime,
        )
    except ValueError as exp:
        logging.error(exp)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f'no data from a backend "{device}" was found from'
                f"{from_datetime.isoformat()} to {to_datetime.isoformat()}."
            ),
        )


@devices_router.get("/{device}/period", response_model=List[DeviceData])
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

    from_datetime = parse_datetime_string(_from)
    to_datetime = parse_datetime_string(to)

    if from_datetime >= to_datetime:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"The 'from' parameter must be before the 'to' parameter.",
        )
    try:
        return await device_info.get_backend_data_snapshot(
            db, device_name=device, from_=from_datetime, to_=to_datetime
        )
    except ValueError as exp:
        logging.error(exp)

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f'no data from a backend "{device}" was found from'
                f"{from_datetime.isoformat()} to {to_datetime.isoformat()}."
            ),
        )


@devices_router.get("/{device}/{type_}", response_model=FilteredDeviceData)
async def get_properties_by_type(db: MongoDbDep, device: str, type_: str):
    """
    Returns the properties of the specified backend's latest snapshot with the given
    type.
    """
    if type_ not in VisualisationType.values():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f'invalid type "{type_}". Valid types are {VisualisationType.values()}',
        )

    try:
        return await device_info.get_properties_by_type(
            db, device_name=device, type_=VisualisationType(type_)
        )
    except mongodb_utils.DocumentNotFoundError as exp:
        logging.error(exp)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Device name {device} doesn't exist",
        )


@devices_router.get(
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
    from_datetime = parse_datetime_string(_from)
    to_datetime = parse_datetime_string(to)

    if from_datetime >= to_datetime:
        raise HTTPException(
            status_code=400,
            detail=f"The 'from' parameter must be before the 'to' parameter.",
        )

    try:
        return await device_info.get_property_over_time(
            db,
            device_name=device,
            components=components,
            property_name=property,
            from_=from_datetime,
            to_=to_datetime,
        )
    except TypeError as exp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"{exp}",
        )
    except ValueError as exp:
        logging.error(exp)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f'no data from a backend "{device}" was found from'
                f"{from_datetime.isoformat()} to {to_datetime.isoformat()}."
            ),
        )
