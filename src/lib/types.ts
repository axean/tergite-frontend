export enum JobStatus {
  PENDING = "pending",
  SUCCESSFUL = "successful",
  FAILED = "failed",
}

export interface Qubit {
  t1_decoherence: CalibrationValue;
  t2_decoherence: CalibrationValue;
  frequency: CalibrationValue;
  anharmonicity: CalibrationValue;
  readout_assignment_error: CalibrationValue;
  [k: string]: CalibrationValue;
}

/**
 * Tuned properties of the device that change on recalibration/tune up
 * These will most likely have a datetime when they were generated.
 *
 * This can allow us to debug jobs that used run through
 * the device a multiple calibrations in the past
 */
export interface DeviceCalibration {
  name: string;
  version: string;
  qubits: Qubit[];
  lastCalibrated: string;
}

export interface CalibrationValue {
  date: string;
  unit: "ns" | "us" | "GHz" | "MHz" | "";
  value: number;
}

export type AggregateValue = Omit<CalibrationValue, "date">;

export interface DeviceCalibrationMedians {
  t1_decoherence?: AggregateValue;
  t2_decoherence?: AggregateValue;
  readout_assignment_error?: AggregateValue;
}

/**
 * Properties of the device that are more or less static
 */
export interface Device {
  name: string;
  version: string;
  numberOfQubits: number;
  lastOnline: string | null | undefined;
  isOnline: boolean;
  basisGates: string[];
  /**
   * this maps what qubit is connect to which other qubit.
   * Preferably use uni-directional mapping
   */
  couplingMap: [number, number][];
  /**
   * the coordinates of for each qubit, where the index is the qubit
   */
  coordinates: [number, number][];
  isSimulator: boolean;
}

export interface Project {
  name: string;
  extId: string;
}

export interface Job {
  jobId: string;
  deviceName: string;
  status: JobStatus;
  failureReason?: string;
  durationInSecs: number | null | undefined;
  createdAt: string;
}

export interface AppState {
  currentProject?: string;
  setCurrentProject: (value: string) => void;
  apiToken?: string;
  setApiToken: (value: string) => void;
}
