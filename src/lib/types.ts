import { NavigateOptions, To } from "react-router-dom";

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

export type UserRequestStatus = "approved" | "rejected" | "pending";
export type UserRequestType =
  | "create-project"
  | "close-project"
  | "transfer-project";

// the type for all requests made by users to be approved by an admin
export interface UserRequest extends DbRecord {
  created_at: string;
  updated_at: string;
  status: UserRequestStatus;
  type: UserRequestType;
  requester_id: string;
  approver_id?: string; // id of admin who has handled it
  rejection_reason?: string;
  request?: unknown;
}

export type ProjectStatus = "live" | "closed";

// the HTTP request body sent when creating a project.
// it ends up as a new Project
export interface CreateProjectPostBody {
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
// the type below is of that request
export interface CreateProjectUserRequest extends UserRequest {
  type: "create-project";
  request: CreateProjectPostBody;
}

// the HTTP response body got when a project is got from API
export interface Project
  extends Omit<CreateProjectPostBody, "user_emails">,
    DbRecord {
  user_ids: string[];
  admin_id: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

// the HTTP request body when updating a project
export interface UpdateProjectPutBody {
  name?: string;
  description?: string;
  user_emails?: string[];
  qpu_seconds?: number;
}

// the HTTP request body when requesting to transfer project
export interface TransferProjectPostBody {
  project_id: string;
  current_admin_id: string;
  new_admin_id: string;
  reason: string;
}

export interface TransferProjectUserRequest extends UserRequest {
  type: "transfer-project";
  request: TransferProjectPostBody;
}

export interface CloseProjectPostBody {
  project_id: string;
  reason: string;
}

export interface CloseProjectUserRequest extends UserRequest {
  type: "close-project";
  request: CloseProjectPostBody;
}

export interface Job extends DbRecord {
  job_id: string;
  project_id?: string;
  user_id?: string;
  device: string;
  status: JobStatus;
  failure_reason?: string;
  duration_in_secs?: number;
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

// the possible auth providers and their email domains
export interface AuthProvider extends DbRecord {
  name: string;
  email_domain: string;
}

// the response from the API detailing the URL to redirect to for authentication
export interface Oauth2RedirectResponse {
  authorization_url: string;
}

export interface AppState {
  currentProject?: string;
  setCurrentProject: (value?: string) => void;
  apiToken?: string;
  setApiToken: (value?: string) => void;
  clear: () => void;
}

export interface ErrorInfo extends Error {
  status?: number;
  statusText?: string;
}

export type NavigatorFunc = (to: To, options?: NavigateOptions) => void;
