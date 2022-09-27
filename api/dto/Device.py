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
from typing import Any, Optional, List, Dict
from api.dto.ZEncodedBaseModel import ZEncodedBaseModel
from api.dto.Qubit import Qubit, QubitConfig
from api.dto.Gate import Gate, GateConfig
from api.dto.Resonator import Resonator, ResonatorConfig
from api.dto.Coupler import Coupler, CouplerConfig


class DeviceInfo(ZEncodedBaseModel):
    backend_name: str
    backend_version: str
    description: str
    sample_name: str
    n_qubits: int
    last_update_date: datetime
    online_date: datetime
    is_online: bool
    qubits: List[QubitConfig]
    gates: List[GateConfig]
    resonators: List[ResonatorConfig]
    couplers: List[CouplerConfig]

    def dict(self, *args, **kwargs) -> Dict[str, Any]:
        kwargs.pop("exclude_none")
        return super().dict(*args, exclude_none=True, **kwargs)


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


class DevicesSimpleInfo(ZEncodedBaseModel):
    backend_name: str
    n_qubits: int
    is_online: bool
    last_update_date: datetime
    backend_version: str
    online_date: datetime
    sample_name: str
