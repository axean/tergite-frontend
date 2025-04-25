# This code is part of Tergite
#
# (C) Copyright Miroslav Dobsicek 2020
# (C) Copyright Simon Genne, Arvid Holmqvist, Bashar Oumari, Jakob Ristner,
#               Björn Rosengren, and Jakob Wik 2022 (BSc project)
# (C) Copyright Fabian Forslund, Niklas Botö 2022
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
# Refactored by Martin Ahindura on 2023-11-08
"""Service that handles calibration functionality"""
import asyncio
from typing import Any, Dict, List, Optional

import pymongo
from motor.motor_asyncio import AsyncIOMotorCollection, AsyncIOMotorDatabase
from pymongo import ReturnDocument

from utils import mongodb as mongodb_utils

from .dtos import DeviceCalibrationV2

_LOGS_COLLECTION = "calibrations_logs"
_MAIN_COLLECTION = "calibrations_v2"


async def on_startup(db: AsyncIOMotorDatabase):
    """Initializes the collections for the calibrations service

    Args:
        db: the mongodb database instance
    """
    calibrations_v2: AsyncIOMotorCollection = db[_MAIN_COLLECTION]
    calibrations_log: AsyncIOMotorCollection = db[_LOGS_COLLECTION]

    await calibrations_v2.create_index([("name", pymongo.ASCENDING)])
    await calibrations_log.create_index(
        [("name", pymongo.ASCENDING), ("last_calibrated", pymongo.DESCENDING)]
    )


# FIXME: We probably need to remove many insert because it makes no sense.
#  Every backend only sends a single set of calibrations at a time.
async def insert_many_v2(db: AsyncIOMotorDatabase, documents: List[Dict[str, Any]]):
    """Inserts into the database the new calibration results

    Args:
        db: the mongo database
        documents: the data to be inserted

    Returns:
        the inserted documents
    """
    # Save historical calibrations
    # We use insert_one_if_not_exists to ensure idempotency
    await asyncio.gather(
        *[
            mongodb_utils.insert_one_if_not_exists(
                collection=db[_LOGS_COLLECTION],
                document=document,
                unique_fields=("name", "last_calibrated"),
                timestamp_path=("last_calibrated",),
            )
            for document in documents
        ]
    )

    # Save current calibration
    return await asyncio.gather(
        *[
            mongodb_utils.update_one(
                collection=db[_MAIN_COLLECTION],
                _filter={"name": document["name"]},
                payload=document,
                return_document=ReturnDocument.AFTER,
                timestamp_path=("last_calibrated",),
                upsert=True,
            )
            for document in documents
        ]
    )


async def get_latest_many_v2(
    db: AsyncIOMotorDatabase, limit: int = -1, filters: Optional[Dict[str, Any]] = None
):
    """Gets the current calibration results for all available devices

    Args:
        db: the mongo database
        limit: the number of results to return: default = -1, meaning all
        filters: the mongodb-like filters to use to extract the calibrations

    Returns:
        the list of calibration results
    """
    return await mongodb_utils.find(db[_MAIN_COLLECTION], filters=filters, limit=limit)


async def get_historical_many_v2(
    db: AsyncIOMotorDatabase, limit: int = -1, filters: Optional[Dict[str, Any]] = None
):
    """Gets the current calibration results for all available devices

    Args:
        db: the mongo database
        limit: the number of results to return: default = -1, meaning all
        filters: the mongodb-like filters to use to extract the calibrations

    Returns:
        the list of calibration results
    """
    return await mongodb_utils.find(db[_LOGS_COLLECTION], filters=filters, limit=limit)


async def get_one_v2(db: AsyncIOMotorDatabase, name: str):
    """Gets the current calibration results of the given device

    Args:
        db: the mongo database
        name: the name of the device

    Returns:
        the dict of the calibration results
    """
    return await mongodb_utils.find_one(
        db[_MAIN_COLLECTION], {"name": name}, dropped_fields=()
    )
