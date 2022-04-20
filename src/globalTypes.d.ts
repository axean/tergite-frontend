type Undefinable<T> = T | undefined;
type Nullable<T> = T | null;

type OneOf<T> = T[keyof T];

namespace Application {
	type Type1Nodes = {
		one_qubit_gates: API.ComponentData[];
		qubits: API.ComponentData[];
		resonators: API.ComponentData[];
	};

	type Type1Links = {
		two_qubit_gates: API.ComponentData[];
		couplers: API.ComponentData[];
	};

	type Id = number;

	type DeviceLayout = {
		nodes: OneOf<DeviceDetailNodes>;
		links: OneOf<DeviceDetailLinks>;
	};
	type Type1 = {
		nodes: Type1Nodes;
		links: Type1Links;
	};

	type Link = {
		id: number;
		from: API.Qubit;
		to: API.Qubit;
		vertical: boolean;
	};

	type TwoQubitGate = Link & {
		gate: string;
		name: string;
	};
	type OneQubitGate = {
		id: number;
		name: string;
		gate: string;
		x: number;
		y: number;
	};

	type Coupler = Link & {
		z_drive_line: number;
	};

	type NodeKeys = keyof DeviceDetailNodes;

	type LinkKeys = keyof DeviceDetailLinks;

	type DeviceDetailNodes = {
		one_qubit_gates: OneQubitGate[];
		qubits: API.Qubit[];
		resonators: API.Resonator[];
	};

	type DeviceDetailLinks = { two_qubit_gates: TwoQubitGate[]; couplers: Coupler[] };

	type DeviceLayouts = { nodeLayouts: DeviceDetailNodes; linkLayouts: DeviceDetailLinks };
}

namespace API {
	namespace Response {
		type Device = {
			backend_name: string;
			n_qubits: number;
			is_online: boolean;
			last_update_date: string;
			backend_version: string;
			online_date: string;
			sample_name: string;
		};

		type DeviceDetail = Device & {
			description: string;
			qubits: Qubit[];
			gates: Gate[];
			resonators: Resonator[];
			couplers: Coupler[];
		};

		type Type1 = {
			qubits: ComponentData[];
			gates: ComponentData[];
			resonators: ComponentData[];
			couplers: ComponentData[];
		};

		type Type2 = Pick<Type1, 'qubits'>;

		type Type3 = Pick<Type1, 'gates'>;

		type Type4Domain = Omit<Type1, 'couplers'>;

		type Type4Codomain = Omit<Type1, 'qubits'>;

		type Type5 = {};
	}

	type ComponentData = { [key: string]: Property[] | number };

	type Property = {
		date: string;
		name: string;
		value: number;
		unit: string;
		types: string[];
	};

	type Qubit = {
		id: number;
		x: number;
		y: number;
		xy_drive_line: number;
		z_drive_line: number;
	};

	type Gate = {
		id: number;
		name: string;
		gate: string;
		qubits: [number, number] | [number];
	};
	type Resonator = {
		id: number;
		x: number;
		y: number;
		readout_line: number;
	};

	type Coupler = {
		id: number;
		z_drive_line: number;
		qubits: [number, number];
	};
}
