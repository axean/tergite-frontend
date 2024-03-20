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
		nodes: OneOf<DeviceDetailNodes> | undefined;
		links: OneOf<DeviceDetailLinks> | undefined;
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
	type Device = {
		backend_name: string;
		n_qubits: number;
		is_online: boolean;
		last_update_date: string;
		backend_version: string;
		online_date: string;
		sample_name: string;
	};

	type QubitProperty = {
		index: number;
		frequency: number;
		pulse_type: string;
		pi_pulse_amplitude: number;
		pi_pulse_duration: number;
		t1_decoherence: number;
		t2_decoherence: number;
	};
	type ResonatorProperty = {
		index: number;
		acq_delay: number;
		acq_integration_time: number;
		frequency: number;
		pulse_type: string;
		pulse_amplitude: number;
		pulse_delay: number;
		pulse_duration: number;
	};
	type CouplerProperty = { [key: string]: any };
	type DeviceCalibration = {
		qubit: QubitProperty[];
		readout_resonator: ResonatorProperty[];
		coupler: CouplerProperty[];
	};
	type TimeLog = {
		REGISTERED: string;
	};
	type ClassificationMeasurement = {
		I: number;
		Q: number;
		state: number;
	};
	type PiPulseAmplitude = {
		qubit_name: string;
		value: number;
	};
	enum MLResult {
		RED = 'red',
		BLUE = 'blue'
	}
	type MLPoint = { x: number; y: number; result: MLResult };
	enum TaskStatus {
		PENDING = 'pending',
		FAILED = 'failed',
		SUCCESS = 'success'
	}

	namespace Response {
		type Devices = API.Device[];
		type DeviceDetail = API.Device & {
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

		type Device = {
			name: string;
			characterized: boolean;
			open_pulse: boolean;
			timelog: TimeLog;
			version: string;
			num_qubits: number;
			num_couplers: number;
			num_resonators: number;
			dt: number;
			dtm: number;
			coupling_map: number[][];
			meas_map: number[][];
			device_properties: DeviceCalibration;
			meas_lo_freq: number[];
			qubit_lo_freq: number[];
			is_online: boolean;
		};
		type Calibration = {
			name: string;
			job_id: string;
			is_online: boolean;
			pi_pulse_amplitude: PiPulseAmplitude[];
			timelog: TimeLog;
		};
		type Classification = {
			name: string;
			job_id: string;
			is_online: boolean;
			timelog: TimeLog;
			classification: { [key: string]: ClassificationMeasurement[] };
		};
		type Configs = {
			mssBaseUrl: string;
			landingPageUrl: string;
			webguiBaseUrl: string;
			correctMLExperimentID: string;
		};
		type RemoteTaskResponse = {
			status: TaskStatus;
			job_id: string;
		};
		type MLExperiment = {
			experiment_id: string;
			timelog: TimeLog;
			results: MLPoint[];
		};
		interface CryostatTempDataPoint {
			temperature: number;
			datetime: string;
		}
		interface ParsedCryostatTempDataPoint extends CryostatTempDataPoint {
			datetime: number;
		}
	}

	type StatusMessage = { message: string };

	type User = {
		id: string;
		roles: UserRole[];
	};

	/**
	 * An error object that has some extra information useful in handling it
	 */
	type EnhancedError = Error & { status?: number; detail?: string };

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
		dynamic_properties: Property[];
		static_properties: Property[];
	};

	type Gate = {
		id: number;
		name: string;
		gate: string;
		qubits: [number, number] | [number];
		dynamic_properties: Property[];
		static_properties: Property[];
	};
	type Resonator = {
		id: number;
		x: number;
		y: number;
		readout_line: number;
		dynamic_properties: Property[];
		static_properties: Property[];
	};

	type Coupler = {
		id: number;
		z_drive_line: number;
		qubits: [number, number];
		dynamic_properties: Property[];
		static_properties: Property[];
	};
}

namespace Next {
	type PageWithLayout<P = {}, IP = P> = NextPage<P, IP> & {
		getLayout?: (page: ReactElement) => ReactNode;
	};

	type AppPropsWithLayout = AppProps & {
		Component: NextPageWithLayout;
	};
}
