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

from ..dtos import (
    DeviceData,
    Gate,
    Property,
    QiskitDeviceData,
    QiskitGate,
    QiskitProperty,
    Qubit,
)


def to_qiskit_device_data(data: DeviceData) -> QiskitDeviceData:
    """Transforms a DeviceData object into a QiskitDeviceData.

    Args:
        data: the device data

    Returns:
        the device data as QiskitDeviceData
    """
    qiskit_gates = list(map(_to_qiskit_gate, data.gates))
    qiskit_qubits = list(map(_to_qiskit_prop_list, data.qubits))
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
def _to_qiskit_property(prop: Property) -> QiskitProperty:
    """Transforms a property into a Qiskit property

    Args:
        prop: the property

    Returns:
        the property as a QiskitProperty
    """
    return QiskitProperty.parse_obj(dict(prop))


def _to_qiskit_gate(gate: Gate) -> QiskitGate:
    """Converts a Gate into a QiskitGate

    Args:
        gate: the gate to convert

    Returns:
        the gate as a QiskitGate
    """
    parameters = list(map(_to_qiskit_property, gate.dynamic_properties))

    return QiskitGate(
        gate=gate.gate,
        name=gate.name,
        parameters=parameters,
        qubits=gate.qubits,
    )


def _to_qiskit_prop_list(qubit: Qubit) -> List[QiskitProperty]:
    """Converts a Qubit into a list of QiskitProperty's

    Args:
        qubit: the qubit to convert

    Returns:
        a list of QiskitProperty's
    """
    props = [*qubit.dynamic_properties, *qubit.static_properties]
    return list(map(_to_qiskit_property, props))
