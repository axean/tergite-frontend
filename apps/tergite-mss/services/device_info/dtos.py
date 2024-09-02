# This code is part of Tergite
#
# (C) Copyright Simon Genne, Arvid Holmqvist, Bashar Oumari, Jakob Ristner,
#               Björn Rosengren, and Jakob Wik 2022 (BSc project)
#
# This code is licensed under the Apache License, Version 2.0. You may
# obtain a copy of this license in the LICENSE.txt file in the root directory
# of this source tree or at http://www.apache.org/licenses/LICENSE-2.0.
#
# Any modifications or derivative works of this code must retain this
# copyright notice, and modified files need to carry a notice indicating
# that they have been altered from the originals.
#
# Refactored by Martin Ahindura 2023-11-08
from datetime import datetime
from enum import Enum
from typing import TYPE_CHECKING, Any, Dict, List, Mapping, Optional, Tuple, Union

from beanie import PydanticObjectId
from bson import ObjectId
from pydantic import BaseModel, Extra

from utils.date_time import datetime_to_zulu
from utils.models import ZEncodedBaseModel

if TYPE_CHECKING:
    DictStrAny = Dict[str, Any]
    IntStr = Union[int, str]
    AbstractSetIntStr = AbstractSet[IntStr]
    MappingIntStrAny = Mapping[IntStr, Any]


class Property(ZEncodedBaseModel):
    date: datetime
    name: str
    unit: str
    value: Optional[
        float
    ]  # FIXME: Made this optional because real data sometimes has nulls
    types: List[str]


class CouplerConfig(BaseModel):
    id: int
    z_drive_line: int
    qubits: List[int]


class Coupler(CouplerConfig):
    dynamic_properties: List[Property]
    static_properties: List[Property]


class GateConfig(BaseModel):
    id: int
    name: str
    gate: str
    qubits: List[int]
    qasm_def: str
    parameters: List[str]


class Gate(GateConfig):
    static_properties: List[Property]
    dynamic_properties: List[Property]


class QubitConfig(BaseModel):
    id: int
    x: int
    y: int
    xy_drive_line: int
    z_drive_line: int


class Qubit(QubitConfig):
    dynamic_properties: List[Property]
    static_properties: List[Property]


class ResonatorConfig(BaseModel):
    id: int
    x: int
    y: int
    readout_line: int


class Resonator(ResonatorConfig):
    dynamic_properties: List[Property]
    static_properties: List[Property]


class BasicDeviceData(ZEncodedBaseModel):
    backend_name: str
    backend_version: str
    sample_name: str
    n_qubits: int
    last_update_date: datetime
    online_date: datetime
    is_online: bool


class DeviceData(ZEncodedBaseModel):
    backend_name: str
    backend_version: str
    description: str
    sample_name: str
    n_qubits: int
    last_update_date: datetime
    online_date: datetime
    qubits: List[Qubit]
    gates: List[Gate]
    resonators: List[Resonator]
    couplers: List[Coupler]


class BasicDeviceConfig(DeviceData):
    is_online: bool
    qubits: List[QubitConfig]
    gates: List[GateConfig]
    resonators: List[ResonatorConfig]
    couplers: List[CouplerConfig]

    def dict(self, *args, **kwargs) -> Dict[str, Any]:
        kwargs.pop("exclude_none")
        return super().dict(*args, exclude_none=True, **kwargs)


class _BaseFullDeviceConfig(ZEncodedBaseModel):
    """
    The shared data between the configuration fetched from the private backend and
    the Qiskit formatted configuration.
    """

    acquisition_latency: Optional[list]
    allow_object_storage: bool
    allow_q_object: bool
    backend_name: str
    backend_version: str
    basis_gates: List[str]
    channels: Optional[dict]
    clops: Optional[int]
    conditional: bool
    conditional_latency: Optional[list]
    credits_required: bool
    default_rep_delay: Optional[int]
    description: str
    discriminators: List[str]
    dt: Optional[float]
    dtm: Optional[float]
    dynamic_reprate_enabled: Optional[bool]
    hamiltonian: Optional[dict]
    input_allowed: List[str]
    local: bool
    max_experiments: int
    max_shots: int
    meas_kernels: Optional[List[str]]
    meas_levels: List[str]
    meas_lo_range: Optional[List[List[float]]]
    meas_map: Optional[List[int]]
    measure_esp_enabled: Optional[bool]
    memory: bool
    multi_meas_enabled: Optional[bool]
    n_qubits: int
    n_registers: bool
    n_uchannels: Optional[int]
    online_date: datetime
    open_pulse: bool
    parametric_pulses: Optional[List[str]]
    processor_type: dict
    pulse_num_channels: Optional[int]
    pulse_num_qubits: Optional[int]
    quantum_volume: Optional[int]
    qubit_channel_mapping: Optional[list]
    qubit_lo_range: Optional[list]
    rep_delay_range: Optional[List[int]]
    rep_times: Optional[List[int]]
    sample_name: str
    simulator: bool
    supported_features: List[str]
    supported_instructions: Optional[List[str]]
    timing_constraints: Optional[dict]
    u_channel_lo: Optional[list]
    uchannels_enabled: Optional[bool]
    url: Optional[str]

    # Remove null values from the returned JSON.
    def dict(self, *args, **kwargs) -> Dict[str, Any]:
        kwargs.pop("exclude_none", None)
        return super().dict(*args, exclude_none=True, **kwargs)


class PrivateBackendFullDeviceConfig(_BaseFullDeviceConfig):
    """
    The unique properties of the configurations from the private backends.
    It contains all possible config properties
    """

    gates: List[GateConfig]
    coupling_map: List[CouplerConfig]
    resonators: List[ResonatorConfig]
    qubits: List[QubitConfig]


class QiskitFullDeviceConfig(_BaseFullDeviceConfig):
    """
    The unique properties of the Qiskit formatted configuration.
    """

    coupling_map: Optional[List[List[int]]]
    gates: List[dict]


class FilteredComponent(ZEncodedBaseModel):
    """
    Represents a component (qubit, coupler, resonator or gate) and a subset of
    its properties over some amount of time.
    """

    __root__: Dict[str, Union[List[Property], int]]


class FilteredDeviceData(ZEncodedBaseModel):
    """
    Represents a device with a subset of its component's properties over some
    amount of time.
    """

    qubits: List[FilteredComponent]
    gates: List[FilteredComponent]
    resonators: List[FilteredComponent]
    couplers: List[FilteredComponent]


class QiskitProperty(BaseModel):
    name: str
    date: datetime
    unit: str
    value: Optional[
        float
    ]  # FIXME: Made this optional because real data in db sometimes has null here


class QiskitGate(BaseModel):
    gate: str
    name: str
    parameters: List[QiskitProperty]
    qubits: List[int]


class QiskitDeviceData(ZEncodedBaseModel):
    backend_name: str
    backend_version: str
    last_update_date: datetime
    gates: List[QiskitGate]
    general: List[QiskitProperty]
    qubits: List[List[QiskitProperty]]


class VisualisationType(Enum):
    TYPE1 = "type1"
    TYPE2 = "type2"
    TYPE3 = "type3"
    TYPE4_DOMAIN = "type4_domain"
    TYPE4_CODOMAIN = "type4_codomain"
    TYPE5 = "type5"

    @classmethod
    def values(cls):
        return list(map(lambda c: c.value, cls))


class DeviceV2Upsert(ZEncodedBaseModel):
    """The schema for upserting device"""

    name: str
    version: str
    number_of_qubits: int
    last_online: Optional[str] = None
    is_online: bool
    basis_gates: List[str]
    coupling_map: List[Tuple[int, int]]
    coordinates: List[Tuple[int, int]]
    is_simulator: bool

    class Config:
        json_encoders = {datetime: datetime_to_zulu}
        extra = Extra.allow

    def dict(
        self,
        *,
        include: Optional[Union["AbstractSetIntStr", "MappingIntStrAny"]] = None,
        exclude: Optional[Union["AbstractSetIntStr", "MappingIntStrAny"]] = None,
        by_alias: bool = False,
        skip_defaults: Optional[bool] = None,
        exclude_unset: bool = False,
        exclude_defaults: bool = False,
        exclude_none: bool = False,
    ) -> "DictStrAny":
        return super().dict(
            include=include,
            exclude=exclude,
            by_alias=by_alias,
            skip_defaults=skip_defaults,
            exclude_defaults=exclude_defaults,
            exclude_none=True,
        )


class DeviceV2(DeviceV2Upsert):
    """The Schema for the devices"""

    id: PydanticObjectId
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        fields = {"id": "_id"}
        orm_mode = True
        json_encoders = {ObjectId: str, datetime: datetime_to_zulu}
        extra = Extra.allow
