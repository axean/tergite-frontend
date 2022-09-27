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


from api.dto.ZEncodedBaseModel import ZEncodedBaseModel
from api.dto.NDUV import NDUV, List
from typing import Dict, Union


class FilteredComponent(ZEncodedBaseModel):
    """
    Represents a component (qubit, coupler, resonator or gate) and a subset of
    its properties over some amount of time.
    """

    __root__: Dict[str, Union[List[NDUV], int]]


class FilteredDeviceData(ZEncodedBaseModel):
    """
    Represents a device with a subset of its component's properties over some
    amount of time.
    """

    qubits: List[FilteredComponent]
    gates: List[FilteredComponent]
    resonators: List[FilteredComponent]
    couplers: List[FilteredComponent]
