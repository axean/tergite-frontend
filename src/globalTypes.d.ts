type Undefinable<T> = T | undefined;
type Nullable<T> = T | null;

namespace API {
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
		qubits: Qubit[];
		gates: Gate[];
		resonators: Resonator[];
		couplers: Coupler[];
	};

	type ComponentData = Record<string, Property[] | number>;

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

	type Property = {
		date: string;
		name: string;
		value: number;
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
