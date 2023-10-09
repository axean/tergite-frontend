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

from typing import List

from ..dto.Device import DeviceData
from ..dto.Gate import Gate
from ..dto.Qiskit import QiskitDeviceData, QiskitGate, QiskitNDUV
from ..dto.Qubit import Qubit


def device_data_to_qiskit(data: DeviceData) -> QiskitDeviceData:
    """
    Transforms a DeviceData object into a QiskitDeviceData.
    """
    qiskit_gates = list(map(_gate_to_qiskit, data.gates))
    qiskit_qubits = list(map(_qubit_to_qiskit, data.qubits))
    general = []

    return QiskitDeviceData(
        backend_name=data.backend_name,
        backend_version=data.backend_version,
        last_update_date=data.last_update_date,
        gates=qiskit_gates,
        qubits=qiskit_qubits,
        general=general,
    )


# Removes types from NDUVs
_NDUV_to_qiskit = lambda nduv: QiskitNDUV.parse_obj(dict(nduv))


def _gate_to_qiskit(gate: Gate) -> QiskitGate:
    parameters = list(map(_NDUV_to_qiskit, gate.dynamic_properties))

    return QiskitGate(
        gate=gate.gate,
        name=gate.name,
        parameters=parameters,
        qubits=gate.qubits,
    )


def _qubit_to_qiskit(qubit: Qubit) -> List[QiskitNDUV]:
    props = [*qubit.dynamic_properties, *qubit.static_properties]
    return list(map(_NDUV_to_qiskit, props))
