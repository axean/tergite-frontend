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
from typing import Any, Dict

from fastapi import APIRouter, HTTPException, Query, status

from api.rest.dependencies import (
    CurrentProjectDep,
    CurrentSystemUserProjectDep,
    MongoDbDep,
)
from services import device_info
from utils import mongodb as mongodb_utils

backends_router = APIRouter(prefix="/backends", tags=["backends"])


@backends_router.get("", dependencies=[CurrentProjectDep])
async def read_backends(db: MongoDbDep):
    """Retrieves all backends"""
    return await device_info.get_all_backends(db)


@backends_router.get("/{name}", dependencies=[CurrentProjectDep])
async def read_backend(db: MongoDbDep, name: str):
    try:
        return await device_info.get_one_backend(db, name=name)
    except mongodb_utils.DocumentNotFoundError as exp:
        logging.error(exp)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"{name} not found"
        )


@backends_router.put("")
async def upsert_backend(
    db: MongoDbDep,
    user: CurrentSystemUserProjectDep,
    payload: Dict[str, Any],
    collection_name: str = Query("backends", alias="collection"),
):
    """Creates a new backend if it does not exist already or updates it.

    It also appends this resultant backend config into the backends log.
    """
    if "name" not in payload:
        return "Backend needs to have a name"

    try:
        await device_info.upsert_backend(
            db, payload=payload, collection_name=collection_name
        )
    except ValueError as exp:
        logging.error(exp)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"{exp}"
        )

    return "OK"


@backends_router.get("/{name}/properties/lda_parameters")
async def read_lda_parameters(
    db: MongoDbDep, user: CurrentSystemUserProjectDep, name: str
):
    try:
        document = await device_info.get_one_backend(db, name=name)
        lda_parameters = document["properties"]["lda_parameters"]
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"backend {name} lacks lda_parameters",
        )

    except mongodb_utils.DocumentNotFoundError as exp:
        logging.error(exp)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"{name} not found"
        )

    return lda_parameters


@backends_router.put("/{name}/properties/lda_parameters")
async def update_lda_parameters(
    db: MongoDbDep, user: CurrentSystemUserProjectDep, name: str, lda_parameters: dict
):
    try:
        await device_info.patch_backend(
            db, name, payload={"properties": {"lda_parameters": lda_parameters}}
        )
    except ValueError as exp:
        logging.error(exp)
        # FIXME: change this to an HTTPException
        return {"message": "Server failed to update the documents."}
    except mongodb_utils.DocumentNotFoundError as exp:
        logging.error(exp)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"{name} not found"
        )

    return "OK"


@backends_router.put("/{name}")
async def update_backend(
    db: MongoDbDep, user: CurrentSystemUserProjectDep, name: str, body: dict
):
    """Updates the given backend with the new body supplied."""
    try:
        await device_info.patch_backend(db, name, payload=body)
    except ValueError as exp:
        logging.error(exp)
        # FIXME: change this to an HTTPException
        return {"message": "Server failed to update the documents."}

    return "OK"
