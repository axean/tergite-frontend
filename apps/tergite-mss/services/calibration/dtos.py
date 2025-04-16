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
from typing import Any, Dict, List, Optional, Union

from beanie import PydanticObjectId
from bson import ObjectId
from pydantic import BaseModel, ConfigDict, Field, field_serializer

from utils.date_time import datetime_to_zulu


class CalibrationUnit(str, enum.Enum):
    ns = "ns"
    s = "s"
    us = "us"
    GHz = "GHz"
    MHz = "MHz"
    Hz = "Hz"
    rad = "rad"
    deg = "deg"
    EMPTY = ""


class CalibrationValue(BaseModel):
    """A calibration value"""

    date: datetime
    unit: CalibrationUnit
    value: Union[float, str, int]

    @field_serializer("date", when_used="json")
    def serialize_date(self, date: datetime):
        """Convert date to string when working with JSON"""
        return datetime_to_zulu(date)


class QubitCalibration(BaseModel, extra="allow"):
    """Schema for the calibration data of the qubit"""

    t1_decoherence: Optional[CalibrationValue] = None
    t2_decoherence: Optional[CalibrationValue] = None
    frequency: Optional[CalibrationValue] = None
    anharmonicity: Optional[CalibrationValue] = None
    readout_assignment_error: Optional[CalibrationValue] = None
    # parameters for x gate
    pi_pulse_amplitude: Optional[CalibrationValue] = None
    pi_pulse_duration: Optional[CalibrationValue] = None
    pulse_type: Optional[CalibrationValue] = None
    pulse_sigma: Optional[CalibrationValue] = None
    id: Optional[int] = None
    index: Optional[CalibrationValue] = None
    x_position: Optional[CalibrationValue] = None
    y_position: Optional[CalibrationValue] = None
    xy_drive_line: Optional[CalibrationValue] = None
    z_drive_line: Optional[CalibrationValue] = None


class ResonatorCalibration(BaseModel, extra="allow"):
    """Schema for the calibration data of the resonator"""

    acq_delay: Optional[CalibrationValue] = None
    acq_integration_time: Optional[CalibrationValue] = None
    frequency: Optional[CalibrationValue] = None
    pulse_amplitude: Optional[CalibrationValue] = None
    pulse_delay: Optional[CalibrationValue] = None
    pulse_duration: Optional[CalibrationValue] = None
    pulse_type: Optional[CalibrationValue] = None
    id: Optional[int] = None
    index: Optional[CalibrationValue] = None
    x_position: Optional[CalibrationValue] = None
    y_position: Optional[CalibrationValue] = None
    readout_line: Optional[CalibrationValue] = None


class CouplersCalibration(BaseModel, extra="allow"):
    """Schema for the calibration data of the coupler"""

    frequency: Optional[CalibrationValue] = None
    frequency_detuning: Optional[CalibrationValue] = None
    anharmonicity: Optional[CalibrationValue] = None
    coupling_strength_02: Optional[CalibrationValue] = None
    coupling_strength_12: Optional[CalibrationValue] = None
    cz_pulse_amplitude: Optional[CalibrationValue] = None
    cz_pulse_dc_bias: Optional[CalibrationValue] = None
    cz_pulse_phase_offset: Optional[CalibrationValue] = None
    cz_pulse_duration_before: Optional[CalibrationValue] = None
    cz_pulse_duration_rise: Optional[CalibrationValue] = None
    cz_pulse_duration_constant: Optional[CalibrationValue] = None
    pulse_type: Optional[CalibrationValue] = None
    id: Optional[int] = None


class DeviceCalibrationV2(BaseModel):
    """Schema for the calibration data of a given device"""

    model_config = ConfigDict(from_attributes=True)

    id: PydanticObjectId = Field(alias="_id")
    name: str
    version: str
    qubits: List[QubitCalibration]
    resonators: Optional[List[ResonatorCalibration]] = None
    couplers: Optional[List[CouplersCalibration]] = None
    discriminators: Optional[Dict[str, Any]] = None
    last_calibrated: datetime

    @field_serializer("last_calibrated", when_used="json")
    def serialize_last_calibrated(self, last_calibrated: datetime):
        """Convert last_calibrated to string when working with JSON"""
        return datetime_to_zulu(last_calibrated)

    @field_serializer("id", when_used="json")
    def serialize_id(self, _id: PydanticObjectId):
        """Convert id to string when working with JSON"""
        return str(_id)
