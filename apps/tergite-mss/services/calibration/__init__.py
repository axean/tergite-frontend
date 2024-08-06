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
from typing import Any, Dict, List
from uuid import UUID

from motor.motor_asyncio import AsyncIOMotorDatabase

from utils import mongodb as mongodb_utils

from .dtos import DeviceCalibrationV2


async def get_latest_many(db: AsyncIOMotorDatabase, limit: int = 10):
    return await mongodb_utils.find(
        db.calibrations,
        limit=limit,
        exclude=("_id",),
        **mongodb_utils.LATEST_FIRST_SORT
    )


async def get_one(db: AsyncIOMotorDatabase, job_id: UUID):
    return await mongodb_utils.find_one(db.calibrations, {"job_id": str(job_id)})


async def insert_many(db: AsyncIOMotorDatabase, documents: List[Dict[str, Any]]):
    return await mongodb_utils.insert_many(
        collection=db.calibrations, documents=documents
    )


async def insert_many_v2(db: AsyncIOMotorDatabase, documents: List[Dict[str, Any]]):
    """Inserts into the database the new calibration results

    Args:
        db: the mongo database
        documents: the data to be inserted

    Returns:
        the inserted documents
    """
    return await mongodb_utils.insert_many(
        collection=db.calibrations_v2, documents=documents
    )


async def get_latest_many_v2(db: AsyncIOMotorDatabase, limit: int = -1):
    """Gets the current calibration results for all available devices

    Args:
        db: the mongo database
        limit: the number of results to return: default = -1, meaning all

    Returns:
        the list of calibration results
    """
    return await mongodb_utils.find(
        db.calibrations_v2, limit=limit, **mongodb_utils.LATEST_FIRST_SORT
    )


async def get_one_v2(db: AsyncIOMotorDatabase, name: str):
    """Gets the current calibration results of the given device

    Args:
        db: the mongo database
        name: the name of the device

    Returns:
        the dict of the calibration results
    """
    return await mongodb_utils.find_one(
        db.calibrations_v2, {"name": name}, dropped_fields=()
    )
