# This code is part of Tergite
#
# (C) Copyright Miroslav Dobsicek 2020
# (C) Copyright Simon Genne, Arvid Holmqvist, Bashar Oumari, Jakob Ristner,
#               Björn Rosengren, and Jakob Wik 2022 (BSc project)
# (C) Copyright Fabian Forslund, Niklas Botö 2022
# (C) Copyright Abdullah-Al Amin 2022
# (C) Copyright Martin Ahindura 2023, 2024
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
from uuid import UUID

from fastapi import APIRouter

from api.rest.dependencies import (
    CurrentProjectDep,
    CurrentSystemUserProjectDep,
    MongoDbDep,
)
from services import calibration as calibration_service

router = APIRouter(prefix="/calibrations", tags=["calibrations"])


@router.get("")
async def read_many(db: MongoDbDep):
    return await calibration_service.get_latest_many_v2(db)


@router.get("/{name}")
async def read_one(db: MongoDbDep, name: str):
    return await calibration_service.get_one_v2(db, name)


@router.post("")
async def create(db: MongoDbDep, user: CurrentSystemUserProjectDep, documents: list):
    try:
        await calibration_service.insert_many_v2(db, documents)
    except Exception as exp:
        return {"message": str(exp)}
    return "OK"
