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


from typing import List, Union

from ..dto.Coupler import CouplerConfig
from ..dto.DeviceConfiguration import PrivateBackendConfiguration, QiskitConfiguration
from ..dto.Gate import GateConfig
from ..dto.Qubit import QubitConfig


def private_backend_config_to_qiskit_format(
    config: PrivateBackendConfiguration,
) -> QiskitConfiguration:
    """
    Returns the given configuration in Qiskit format.
    """

    qiskit_coupling_map = _get_qiskit_formatted_coupling_map(
        config.coupling_map,
        config.qubits,
    )
    qiskit_gates = _get_qiskit_formatted_gates(
        config.gates,
        config.qubits,
    )

    config_dict = {
        **dict(config),
        "coupling_map": qiskit_coupling_map,
        "gates": qiskit_gates,
    }

    return QiskitConfiguration.parse_obj(config_dict)


def _get_qiskit_formatted_coupling_map(
    couplers: List[CouplerConfig],
    qubits: List[QubitConfig],
) -> List[List[int]]:
    qiskit_coupling_map = []

    for coupler in couplers:
        connected_qubit_indices = []
        for connected_qubit_id in coupler.qubits:
            connected_qubit_index = _qubit_id_to_index(qubits, connected_qubit_id)

            if connected_qubit_index is None:
                raise ValueError(f"No qubit with id {connected_qubit_id} was found.")

            connected_qubit_indices.append(connected_qubit_index)
        qiskit_coupling_map.append(connected_qubit_indices)

    return qiskit_coupling_map


def _get_qiskit_formatted_gates(
    gates: List[GateConfig], qubits: List[QubitConfig]
) -> List[dict]:
    qiskit_gates = {}

    for gate in gates:
        gate_type = gate.gate
        coupled_qubit_ids = gate.qubits

        coupled_qubit_indeces = list(
            map(lambda q_id: _qubit_id_to_index(qubits, q_id), coupled_qubit_ids)
        )

        if gate_type in qiskit_gates.keys():
            qiskit_gates[gate_type]["coupling_map"].append(coupled_qubit_indeces)
        else:
            qiskit_gate = {
                "name": gate_type,
                "coupling_map": [coupled_qubit_indeces],
                "parameters": gate.parameters,
                "qasm_def": gate.qasm_def,
            }
            qiskit_gates[gate_type] = qiskit_gate
    return list(qiskit_gates.values())


def _qubit_id_to_index(qubits: List[QubitConfig], qubit_id: int) -> Union[int, None]:
    return next((index for index, qubit in enumerate(qubits) if qubit.id == qubit_id))
