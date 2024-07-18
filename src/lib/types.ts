export enum JobStatus {
  PENDING = "pending",
  SUCCESSFUL = "successful",
  FAILED = "failed",
}

export interface DbRecord {
  id: string;
  created_at?: string;
  updated_at?: string;
}

export type QubitProp =
  | "t1_decoherence"
  | "t2_decoherence"
  | "frequency"
  | "anharmonicity"
  | "readout_assignment_error";

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
export interface DeviceCalibration extends DbRecord {
  name: string;
  version: string;
  qubits: Qubit[];
  last_calibrated: string;
}

export interface CalibrationValue {
  date: string;
  unit: "ns" | "us" | "GHz" | "MHz" | "";
  value: number;
}

export interface CalibrationDataPoint extends CalibrationValue {
  index: number;
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
export interface Device extends DbRecord {
  name: string;
  version: string;
  number_of_qubits: number;
  last_online: string | null | undefined;
  is_online: boolean;
  basis_gates: string[];
  /**
   * this maps what qubit is connected to which other qubit.
   * Preferably use uni-directional mapping
   */
  coupling_map: [number, number][];
  /**
   * the coordinates of for each qubit, where the index is the qubit
   */
  coordinates: [number, number][];
  is_simulator: boolean;
}

export type ApprovalStatus = "approved" | "rejected" | "pending";
export type ApprovalRequestType =
  | "create-project"
  | "close-project"
  | "transfer-project";

// the type for all responses for approval requests
export interface Approval extends DbRecord {
  created_at: string;
  updated_at: string;
  status: ApprovalStatus;
  request_type: ApprovalRequestType;
  requested_by: string;
  handled_by?: string; // id of admin who has handled it
  rejection_reason?: string;
  request?: unknown;
}

export type ProjectStatus = "live" | "closed";

// the HTTP request body sent when creating a project.
// it ends up as a new Project
export interface ProjectCreationRequest {
  name: string;
  ext_id: string;
  description?: string;
  user_emails: string[];
  qpu_seconds: number;
}

// An approval is created in the database with given data
// but a new project is only created in the database using this data
// after approval is given.
//
// the type below is of that approval
export interface ProjectCreation extends Approval {
  request_type: "create-project";
  request: ProjectCreationRequest;
}

// the HTTP response body got when a project is got from API
export interface Project extends ProjectCreationRequest {
  id: string;
  owner_email: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

// the HTTP request body when updating a project
export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
  user_emails?: string[];
  qpu_seconds?: number;
}

// the HTTP request body when requesting to transfer project
export interface ProjectTransferRequest {
  project_id: string;
  current_owner: string; // email
  new_owner: string; // email
  reason: string;
}

export interface ProjectTransfer extends Approval {
  request_type: "transfer-project";
  request: ProjectTransferRequest;
}

export interface ProjectCloseRequest {
  id: string;
  project_id: string;
  reason: string;
}

export interface ProjectClose extends Approval {
  request_type: "close-project";
  request: ProjectCloseRequest;
}

export interface Job extends DbRecord {
  job_id: string;
  project_id?: string;
  user_id?: string;
  device: string;
  status: JobStatus;
  failure_reason?: string;
  duration_in_secs: number | null | undefined;
  created_at: string;
}

export type UserRole = "admin" | "system" | "researcher" | "user" | "partner";

export interface User extends DbRecord {
  roles: UserRole[];
  email: string;
  name: string;
  organization?: string;
}

export interface AppToken extends DbRecord {
  title: string;
  user_id: string;
  project_ext_id: string;
  lifespan_seconds: number;
  created_at: string;
}

// the HTTP request body for creating an app token
export interface AppTokenCreationRequest {
  title: string;
  project_ext_id: string;
  lifespan_seconds: number;
}

// the HTTP response body after the creation of the app token
export interface AppTokenCreationResponse {
  access_token: string;
  token_type: string;
}

export interface AppState {
  currentProject?: string;
  setCurrentProject: (value: string) => void;
  apiToken?: string;
  setApiToken: (value: string) => void;
}

export interface ErrorInfo extends Error {
  status?: number;
  statusText?: string;
}
