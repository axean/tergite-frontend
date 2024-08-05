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


async def on_startup() -> None:
    """Call this event when fastapi starts. Currently not used."""
    print("Service started up!")


async def get_all_devices(db: AsyncIOMotorDatabase):
    """Gets all devices in the devices collection

    Args:
        db: the mongo database from which to get the databases

    Returns:
        a list of all devices found in the devices collection
    """
    return await mongodb_utils.find(
        db.devices, limit=-1, **mongodb_utils.LATEST_FIRST_SORT
    )


async def get_one_device(db: AsyncIOMotorDatabase, name: str):
    """Gets the device of the given name

    Args:
        db: the mongo database where the device information is stored
        name: the name of the device to return

    Returns:
        the device as a dictionary
    """
    return await mongodb_utils.find_one(db.devices, {"name": name})


# FIXME: Create a standard schema for the given payload
async def upsert_device(db: AsyncIOMotorDatabase, payload: Dict[str, Any]):
    """Creates a new device or updates it if it exists

    Args:
        db: the mongo database where the device information is stored
        payload: the devices dict

    Returns:
        the new device

    Raises:
        ValueError: could not insert '{payload['name']}' document
    """
    # this is to ensure that if any timelog is passed is removed
    payload.pop("timelog", None)
    timestamp = get_current_timestamp()
    payload["timelog.LAST_UPDATED"] = timestamp

    device = await db.devices.find_one_and_update(
        {"name": str(payload["name"])},
        {"$set": payload, "$setOnInsert": {"timelog.REGISTERED": timestamp}},
        upsert=True,
        return_document=pymongo.ReturnDocument.AFTER,
    )

    if device is None:
        raise ValueError(
            f"could not insert '{payload['name']}' document.",
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
    return await mongodb_utils.update_many(
        db.devices,
        _filter={"name": str(name)},
        payload=payload,
    )
