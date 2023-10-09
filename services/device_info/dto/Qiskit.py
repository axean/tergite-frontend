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
from typing import List, Optional

from pydantic import BaseModel

from .ZEncodedBaseModel import ZEncodedBaseModel


class QiskitNDUV(BaseModel):
    name: str
    date: datetime
    unit: str
    value: Optional[
        float
    ]  # FIXME: the data in the database has nulls in this property for some records


class QiskitGate(BaseModel):
    gate: str
    name: str
    parameters: List[QiskitNDUV]
    qubits: List[int]


class QiskitDeviceData(ZEncodedBaseModel):
    backend_name: str
    backend_version: str
    last_update_date: datetime
    gates: List[QiskitGate]
    general: List[QiskitNDUV]
    qubits: List[List[QiskitNDUV]]
