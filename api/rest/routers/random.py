# This code is part of Tergite
#
# (C) Copyright Miroslav Dobsicek 2020
# (C) Copyright Simon Genne, Arvid Holmqvist, Bashar Oumari, Jakob Ristner,
#               Björn Rosengren, and Jakob Wik 2022 (BSc project)
# (C) Copyright Fabian Forslund, Niklas Botö 2022
# (C) Copyright Abdullah-Al Amin 2022
# (C) Copyright Martin Ahindura 2023
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, HTTPException, status

from api.rest.dependencies import CurrentSystemUserDep, MongoDbDep
from services import random_numbers as rng_service
from utils import mongodb as mongodb_utils

# FIXME: Ideally we should have one router with one prefix as this is a single resource being controlled,
#   but for backward-compatibility (external code depends on them), they are still here. I hope we settle on one.
rng_router = APIRouter(prefix="/rng", tags=["rng"])
random_router = APIRouter(prefix="/random", tags=["random"])


@rng_router.get("/{job_id}")
async def read_rng(db: MongoDbDep, job_id: UUID):
    try:
        return await rng_service.get_one(db, job_id)
    except mongodb_utils.DocumentNotFoundError as exp:
        logging.error(exp)
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"rng of job_id: {job_id} not found",
        )


@random_router.post("")
async def create_many_rng(
    db: MongoDbDep, user: CurrentSystemUserDep, documents: List[rng_service.dtos.Rng]
):
    """
    Store documents containing batches of random numbers.
    One document is one batch of random numbers requested by a user.
    """
    try:
        await rng_service.insert_many(db, documents)
    except Exception as exp:
        return {"message": str(exp)}
    return "OK"
