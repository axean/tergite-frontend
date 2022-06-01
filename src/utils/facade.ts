/**
	this function ensures that for all links {x0,y0,x1,y1} x0 < x1 and y0 < y1
	this is needed for the padding of the links to work correctly
*/
function fixDirections(link: Application.TwoQubitGate | Application.Coupler) {
	let { from, to, id } = link;
	let temp;
	if (from.x < to.x) {
		temp = from;
		from = to;
		to = temp;
	} else if (from.y < to.y) {
		temp = from;
		from = to;
		to = temp;
	}
	return { ...link, from, to, vertical: from.x === to.x ? true : false } as typeof link;
}

function facadeDeviceDetail(device: API.Response.DeviceDetail): Application.DeviceLayouts {
	let newData = { ...device } as API.Response.DeviceDetail & {
		one_qubit_gates: API.Gate[];
		two_qubit_gates: API.Gate[];
	};
	newData['one_qubit_gates'] = newData.gates.filter((gate) => gate.qubits.length === 1);
	newData['two_qubit_gates'] = newData.gates.filter((gate) => gate.qubits.length === 2);

	const two_qubit_gates: Application.TwoQubitGate[] = newData.two_qubit_gates.map(
		({ id, gate, qubits, name }) => {
			let fromId = (qubits as [number, number])[0];
			let toId = (qubits as [number, number])[1];
			let fromQubit = newData.qubits.find((qubit) => qubit.id === fromId);
			let toQubit = newData.qubits.find((qubit) => qubit.id === toId);
			return fixDirections({
				id,
				gate,
				name,
				from: fromQubit,
				to: toQubit,
				vertical: false
			}) as Application.TwoQubitGate;
		}
	);
	const couplers: Application.Coupler[] = newData.couplers.map(({ id, qubits, z_drive_line }) => {
		let fromId = qubits[0];
		let toId = qubits[1];
		let fromQubit = newData.qubits.find((qubit) => qubit.id === fromId);
		let toQubit = newData.qubits.find((qubit) => qubit.id === toId);
		return fixDirections({
			id,
			z_drive_line,
			from: fromQubit,
			to: toQubit,
			vertical: false
		}) as Application.Coupler;
	});

	const one_qubit_gates: Application.OneQubitGate[] = newData.one_qubit_gates.map(
		({ id, name, gate, qubits }) => {
			let qubitId = (qubits as [number])[0];
			let qubit = newData.qubits.find((qubit) => qubit.id === qubitId);

			return { id, name, gate, x: qubit.x, y: qubit.y };
		}
	);

	return {
		nodeLayouts: {
			one_qubit_gates,
			qubits: newData.qubits,
			resonators: newData.resonators
		},
		linkLayouts: { two_qubit_gates, couplers }
	};
}

function facadeType1(
	data: API.Response.Type1,
	device: Application.DeviceLayouts
): Application.Type1 {
	let newData = { ...data } as API.Response.Type1 & {
		one_qubit_gates: API.ComponentData[];
		two_qubit_gates: API.ComponentData[];
	};

	newData['one_qubit_gates'] = newData.gates.filter((e) =>
		device.nodeLayouts.one_qubit_gates.some((qubit) => qubit.id === e.id)
	);
	newData['two_qubit_gates'] = newData.gates.filter((e) =>
		device.linkLayouts.two_qubit_gates.some((qubit) => qubit.id === e.id)
	);
	delete newData.gates;
	return {
		nodes: {
			one_qubit_gates: newData.one_qubit_gates,
			qubits: newData.qubits,
			resonators: newData.resonators
		},
		links: { two_qubit_gates: newData.two_qubit_gates, couplers: newData.couplers }
	};
}

export { facadeDeviceDetail, facadeType1 };
