export enum JobStatus {
  PENDING = "pending",
  SUCCESSFUL = "successful",
  FAILED = "failed",
}

export interface Device {
  name: string;
  numberOfQubits: number;
  lastOnline: string | null | undefined;
  isOnline: boolean;
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
