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


async def get_latest_many(db: AsyncIOMotorDatabase, limit: int = 10):
    return await mongodb_utils.find_all(
        db.calibrations, limit=limit, **mongodb_utils.LATEST_FIRST_SORT
    )


async def get_one(db: AsyncIOMotorDatabase, job_id: UUID):
    return await mongodb_utils.find_one(db.calibrations, {"job_id": str(job_id)})


async def insert_many(db: AsyncIOMotorDatabase, documents: List[Dict[str, Any]]):
    return await mongodb_utils.insert_many(
        collection=db.calibrations, documents=documents
    )
