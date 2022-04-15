function facade(
	data,
	type: 'root' | 'type1' | 'type2' | 'type3' | 'type4' | 'type5',
	rootData?: any
) {
	if (type === 'root') {
		let newData = { ...data };
		newData['one_qubit_gates'] = newData.gates.filter((gate) => gate.qubits.length === 1);
		newData['two_qubit_gates'] = newData.gates.filter((gate) => gate.qubits.length === 2);
		return {
			nodes: {
				one_qubit_gates: newData.one_qubit_gates,
				qubits: newData.qubits,
				resonators: newData.qubits
			},
			links: { two_qubit_gates: newData.two_qubit_gates, couplers: newData.couplers }
		};
	}
	if (type === 'type1' && rootData) {
		let newData = { ...data };

		newData['one_qubit_gates'] = newData.gates.filter((e) =>
			rootData.nodes.one_qubit_gates.some((qubit) => qubit.id === e.id)
		);
		newData['two_qubit_gates'] = newData.gates.filter((e) =>
			rootData.links.two_qubit_gates.some((qubit) => qubit.id === e.id)
		);
		delete newData.gates;
		console.log('newData', newData);
		return {
			nodes: {
				one_qubit_gates: newData.one_qubit_gates,
				qubits: newData.qubits,
				resonators: newData.qubits
			},
			links: { two_qubit_gates: newData.two_qubit_gates, couplers: newData.couplers }
		};
	}
}

export default facade;
