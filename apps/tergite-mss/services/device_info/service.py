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

from typing import Any, Dict

import pymongo
from motor.motor_asyncio import AsyncIOMotorDatabase

from utils import mongodb as mongodb_utils
from utils.date_time import get_current_timestamp

from .config import app_config

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
    return await mongodb_utils.find(
        db.backends, limit=-1, exclude=("_id",)
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
async def upsert_backend(
    db: AsyncIOMotorDatabase, payload: Dict[str, Any], collection_name: str
):
    """Creates a new backend in the given collection or updates it if it exists

    It also appends the resultant backend config into the backends log

    Args:
        db: the mongo database where the backend information is stored
        payload: the backend dict
        collection_name: the name of the collection into which to upsert the backend

    Returns:
        the new backend

    Raises:
        ValueError: could not insert '{payload['name']}' document into the '{collection_name}' collection.
    """
    collection = db[collection_name]
    # this is to ensure that if any timelog is passed is removed
    payload.pop("timelog", None)
    timestamp = get_current_timestamp()
    payload["timelog.LAST_UPDATED"] = timestamp

    backend = await collection.find_one_and_update(
        {"name": str(payload["name"])},
        {"$set": payload, "$setOnInsert": {"timelog.REGISTERED": timestamp}},
        upsert=True,
        return_document=pymongo.ReturnDocument.AFTER,
    )

    if backend is None:
        raise ValueError(
            f"could not insert '{payload['name']}' document into the '{collection_name}' collection.",
        )

    return backend


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
