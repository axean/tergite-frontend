# This code is part of Tergite
#
# (C) Copyright Martin Ahindura 2024
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
"""Data Transfer Objects for calibration"""
import enum
from datetime import datetime
from typing import List

from beanie import PydanticObjectId
from bson import ObjectId
from pydantic import Extra

from utils.models import ZEncodedBaseModel


class CalibrationUnit(str, enum.Enum):
    ns = "ns"
    s = "s"
    us = "us"
    GHz = "GHz"
    MHz = "MHz"
    Hz = "Hz"
    EMPTY = ""


class CalibrationValue(ZEncodedBaseModel):
    """A calibration value"""

    date: datetime
    unit: CalibrationUnit
    value: float


class QubitCalibration(ZEncodedBaseModel, extra=Extra.allow):
    """Schema for the calibration data of the qubit"""

    t1_decoherence: CalibrationValue
    t2_decoherence: CalibrationValue
    frequency: CalibrationValue
    anharmonicity: CalibrationValue
    readout_assignment_error: CalibrationValue


class DeviceCalibrationV2(ZEncodedBaseModel):
    """Schema for the calibration data of a given device"""

    id: PydanticObjectId
    name: str
    version: str
    qubits: List[QubitCalibration]
    last_calibrated: datetime

    class Config:
        orm_mode = True
        json_encoders = {ObjectId: str}
        fields = {"id": "_id"}
