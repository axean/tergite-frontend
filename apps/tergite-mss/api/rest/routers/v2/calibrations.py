# This code is part of Tergite
#
# (C) Copyright Miroslav Dobsicek 2020
# (C) Copyright Simon Genne, Arvid Holmqvist, Bashar Oumari, Jakob Ristner,
#               Björn Rosengren, and Jakob Wik 2022 (BSc project)
# (C) Copyright Fabian Forslund, Niklas Botö 2022
# (C) Copyright Abdullah-Al Amin 2022
# (C) Copyright Martin Ahindura 2023
# (C) Chalmers Next Labs AB 2024
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
from typing import List

from fastapi import APIRouter

from api.rest.dependencies import CurrentSystemUserProjectDep, MongoDbDep
from services import calibration as calibration_service

router = APIRouter(prefix="/calibrations", tags=["calibrations"])


@router.get("", response_model=List[calibration_service.DeviceCalibrationV2])
async def read_many(db: MongoDbDep):
    return await calibration_service.get_latest_many_v2(db)


@router.get("/{name}", response_model=calibration_service.DeviceCalibrationV2)
async def read_one(db: MongoDbDep, name: str):
    return await calibration_service.get_one_v2(db, name)


@router.post("")
async def create(db: MongoDbDep, user: CurrentSystemUserProjectDep, documents: list):
    # FIXME: Breaking change - let this receive only a single document. The backend needs to be changed as a result
    await calibration_service.insert_many_v2(db, documents)
    return "OK"
