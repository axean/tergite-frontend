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


from pydantic import BaseModel

from .NDUV import NDUV, List


class GateConfig(BaseModel):
    id: int
    name: str
    gate: str
    qubits: List[int]
    qasm_def: str
    parameters: List[str]


class Gate(GateConfig):
    static_properties: List[NDUV]
    dynamic_properties: List[NDUV]
