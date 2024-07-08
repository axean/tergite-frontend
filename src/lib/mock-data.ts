import { Device, Project, Job, JobStatus } from "./types";

export const deviceList: Device[] = [
  {
    name: "Loke",
    numberOfQubits: 8,
    isOnline: false,
    lastOnline: "2024-05-23T09:12:00.733Z",
  },
  { name: "Thor", numberOfQubits: 5, isOnline: true, lastOnline: null },
  {
    name: "Pingu",
    numberOfQubits: 20,
    isOnline: false,
    lastOnline: "2024-05-24T09:12:00.733Z",
  },
];

export const projectList: Project[] = [
  { name: "NordIQuEst", extId: "NordIQuEst-908" },
  { name: "OpenSuperQPlus", extId: "OpenSuperQPlus-765" },
  { name: "WACQT General", extId: "WACQT General-6452" },
];

export const jobList: Job[] = [
  {
    jobId: "1",
    deviceName: "Loke",
    status: JobStatus.SUCCESSFUL,
    durationInSecs: 400,
    createdAt: "2024-06-20T09:12:00.733Z",
  },
  {
    jobId: "2",
    deviceName: "Loke",
    status: JobStatus.SUCCESSFUL,
    durationInSecs: 500,
    createdAt: "2024-06-20T08:12:00.733Z",
  },
  {
    jobId: "3",
    deviceName: "Pingu",
    status: JobStatus.PENDING,
    durationInSecs: null,
    createdAt: "2024-06-11T10:12:00.733Z",
  },
  {
    jobId: "4",
    deviceName: "Loke",
    status: JobStatus.SUCCESSFUL,
    durationInSecs: 400,
    createdAt: "2024-06-20T11:12:00.733Z",
  },
  {
    jobId: "5",
    deviceName: "Pingu",
    status: JobStatus.SUCCESSFUL,
    durationInSecs: 800,
    createdAt: "2024-06-19T12:12:00.733Z",
  },
  {
    jobId: "6",
    deviceName: "Thor",
    status: JobStatus.FAILED,
    failureReason: "device offline",
    durationInSecs: 400,
    createdAt: "2024-06-20T23:12:00.733Z",
  },
];
