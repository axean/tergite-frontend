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
# Refactored by Martin Ahindura - 2023-11-08, 2024-08-01


import logging
from typing import List

from fastapi import APIRouter, HTTPException, status

from api.rest.dependencies import CurrentSystemUserProjectDep, MongoDbDep
from services import devices
from utils import mongodb as mongodb_utils

router = APIRouter(prefix="/devices", tags=["devices"])


@router.get("")
async def read_many(db: MongoDbDep):
    """Retrieves all devices"""
    records = await devices.get_all_devices(db)
    return [
        devices.Device.model_validate(item).model_dump(mode="json") for item in records
    ]


@router.get("/{name}")
async def read_one(db: MongoDbDep, name: str):
    record = await devices.get_one_device(db, name=name)
    return devices.Device.model_validate(record).model_dump(mode="json")


@router.put("")
async def upsert(
    db: MongoDbDep,
    user: CurrentSystemUserProjectDep,
    payload: devices.DeviceUpsert,
):
    """Creates a new backend if it does not exist already or updates it.

    It also appends this resultant backend config into the backends log.
    """
    record = await devices.upsert_device(db, payload=payload)
    return devices.Device.model_validate(record).model_dump(mode="json")


@router.put("/{name}")
async def update(
    db: MongoDbDep, user: CurrentSystemUserProjectDep, name: str, body: dict
):
    """Updates the given backend with the new body supplied."""
    record = await devices.patch_device(db, name, payload=body)
    return devices.Device.model_validate(record).model_dump(mode="json")
