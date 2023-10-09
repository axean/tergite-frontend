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


from datetime import datetime
from typing import Any, Dict, List, Optional

from .Coupler import CouplerConfig
from .Gate import GateConfig
from .Qubit import QubitConfig
from .Resonator import ResonatorConfig
from .ZEncodedBaseModel import ZEncodedBaseModel


class Configuration(ZEncodedBaseModel):
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
        kwargs.pop("exclude_none")
        return super().dict(*args, exclude_none=True, **kwargs)


class PrivateBackendConfiguration(Configuration):
    """
    The unique properties of the configurations from the private backends.
    """

    gates: List[GateConfig]
    coupling_map: List[CouplerConfig]
    resonators: List[ResonatorConfig]
    qubits: List[QubitConfig]


class QiskitConfiguration(Configuration):
    """
    The unique properties of the Qiskit formatted configuration.
    """

    coupling_map: Optional[List[List[int]]]
    gates: List[dict]
