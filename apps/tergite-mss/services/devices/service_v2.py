# This code is part of Tergite
#
# (C) Copyright Simon Genne, Arvid Holmqvist, Bashar Oumari, Jakob Ristner,
#               Björn Rosengren, and Jakob Wik 2022 (BSc project)
# (C) Copyright Abdullah-Al Amin 2022
# (C) Copyright Martin Ahindura 2024
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.

from typing import Any, Dict

import pymongo
from motor.motor_asyncio import AsyncIOMotorDatabase

from utils import mongodb as mongodb_utils
from utils.date_time import get_current_timestamp

from .dtos import DeviceV2Upsert


async def get_all_devices(db: AsyncIOMotorDatabase):
    """Gets all devices in the devices collection

    Args:
        db: the mongo database from which to get the databases

    Returns:
        a list of all devices found in the devices collection
    """
    return await mongodb_utils.find(
        db.devices,
        limit=-1,
        sorted_by=[("created_at", pymongo.DESCENDING)],
    )


async def get_one_device(db: AsyncIOMotorDatabase, name: str):
    """Gets the device of the given name

    Args:
        db: the mongo database where the device information is stored
        name: the name of the device to return

    Returns:
        the device as a dictionary
    """
    return await mongodb_utils.find_one(db.devices, {"name": name}, dropped_fields=())


async def upsert_device(db: AsyncIOMotorDatabase, payload: DeviceV2Upsert):
    """Creates a new device or updates it if it exists

    Args:
        db: the mongo database where the device information is stored
        payload: the device

    Returns:
        the new device

    Raises:
        ValueError: could not insert '{payload['name']}' document
    """
    timestamp = get_current_timestamp()
    payload.updated_at = timestamp

    device = await db.devices.find_one_and_update(
        {"name": payload.name},
        {"$set": payload.model_dump(), "$setOnInsert": {"created_at": timestamp}},
        upsert=True,
        return_document=pymongo.ReturnDocument.AFTER,
    )

    if device is None:
        raise ValueError(
            f"could not insert '{payload.name}' document.",
        )

    return device


async def patch_device(db: AsyncIOMotorDatabase, name: str, payload: Dict[str, Any]):
    """Patches the devices data for the device of the given name

    Args:
        db: the mongo database from where to get the job
        name: the name of the device
        payload: the new data to patch into the device data

    Returns:
        the number of documents that were modified

    Raises:
        ValueError: server failed updating documents
        DocumentNotFoundError: no documents matching {"name": name} were found
    """
    device = await db.devices.find_one_and_update(
        {"name": name},
        {"$set": {**payload, "updated_at": get_current_timestamp()}},
        return_document=pymongo.ReturnDocument.AFTER,
    )

    if device is None:
        raise ValueError(f"device '{name}' not found")

    return device
