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
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Query, status

from api.rest.dependencies import CurrentSystemUserProjectDep, MongoDbDep
from services import device_info
from utils import mongodb as mongodb_utils

router = APIRouter(prefix="/devices", tags=["devices"])


@router.get("")
async def read_many(db: MongoDbDep):
    """Retrieves all devices"""
    return await device_info.get_all_devices(db)


@router.get("/{name}")
async def read_one(db: MongoDbDep, name: str):
    try:
        return await device_info.get_one_device(db, name=name)
    except mongodb_utils.DocumentNotFoundError as exp:
        logging.error(exp)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"{name} not found"
        )


@router.put("")
async def upsert(
    db: MongoDbDep,
    user: CurrentSystemUserProjectDep,
    payload: Dict[str, Any],
):
    """Creates a new backend if it does not exist already or updates it.

    It also appends this resultant backend config into the backends log.
    """
    if "name" not in payload:
        return "Device needs to have a name"

    try:
        await device_info.upsert_device(db, payload=payload)
    except ValueError as exp:
        logging.error(exp)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"{exp}"
        )

    return "OK"


@router.put("/{name}")
async def update(
    db: MongoDbDep, user: CurrentSystemUserProjectDep, name: str, body: dict
):
    """Updates the given backend with the new body supplied."""
    try:
        await device_info.patch_device(db, name, payload=body)
    except ValueError as exp:
        logging.error(exp)
        # FIXME: change this to an HTTPException
        return {"message": "Server failed to update the documents."}

    return "OK"
