import { FetchQueryOptions } from "@tanstack/react-query";
import { Device, DeviceCalibration, Job, Project } from "./types";

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

/**
 * the devices query for using with react query
 */
export const devicesQuery: FetchQueryOptions<
  Device[],
  Error,
  Device[],
  string[],
  never
> = {
  queryKey: [apiBaseUrl, "devices"],
  queryFn: async () => await getDevices(),
};

/**
 * the single device query for using with react query
 */
export function singleDeviceQuery(
  name: string
): FetchQueryOptions<Device, Error, Device, string[], never> {
  return {
    queryKey: [apiBaseUrl, "devices", name],
    queryFn: async () => await getDeviceDetail(name),
  };
}

/**
 * the devices query for using with react query
 */
export const calibrationsQuery: FetchQueryOptions<
  DeviceCalibration[],
  Error,
  DeviceCalibration[],
  string[],
  never
> = {
  queryKey: [apiBaseUrl, "calibrations"],
  queryFn: async () => await getCalibrations(),
};

/**
 * the single device's calibration query for using with react query
 */
export function singleDeviceCalibrationQuery(
  name: string
): FetchQueryOptions<
  DeviceCalibration,
  Error,
  DeviceCalibration,
  string[],
  never
> {
  return {
    queryKey: [apiBaseUrl, "calibrations", name],
    queryFn: async () => await getCalibrationsForDevice(name),
  };
}

/**
 * the my jobs query for using with react query
 */
export const myJobsQuery: FetchQueryOptions<
  Job[],
  Error,
  Job[],
  string[],
  never
> = {
  queryKey: [apiBaseUrl, "me", "jobs"],
  queryFn: async () => await getMyJobs(),
};

/**
 * the my projects query for using with react query
 */
export const myProjectsQuery: FetchQueryOptions<
  Project[],
  Error,
  Project[],
  string[],
  never
> = {
  queryKey: [apiBaseUrl, "me", "projects"],
  queryFn: async () => await getMyProjects(),
};

/**
 * Retrieves the devices on the system
 * @param baseUrl - the API base URL
 */
async function getDevices(baseUrl: string = apiBaseUrl): Promise<Device[]> {
  return await authenticatedFetch(`${baseUrl}/devices`);
}

/**
 * Retrieve the given device on the system
 * @param name - the name of the device
 * @param baseUrl - the API base URL
 */
async function getDeviceDetail(
  name: string,
  baseUrl: string = apiBaseUrl
): Promise<Device> {
  return await authenticatedFetch(`${baseUrl}/devices/${name}`);
}

/**
 * Retrieves the calibration data for the devices on the system
 * @param baseUrl - the API base URL
 */
async function getCalibrations(
  baseUrl: string = apiBaseUrl
): Promise<DeviceCalibration[]> {
  return await authenticatedFetch(`${baseUrl}/calibrations`);
}

/**
 * Retrieves the calibration data for the devices on the system
 * @param name - the name of the device
 * @param baseUrl - the API base URL
 */
async function getCalibrationsForDevice(
  name: string,
  baseUrl: string = apiBaseUrl
): Promise<DeviceCalibration> {
  return await authenticatedFetch(`${baseUrl}/calibrations/${name}`);
}

/**
 * Retrieves the jobs for the current user on the system
 * @param baseUrl - the API base URL
 */
async function getMyJobs(baseUrl: string = apiBaseUrl): Promise<Job[]> {
  return await authenticatedFetch(`${baseUrl}/me/jobs`);
}

/**
 * Retrieves the projects for the current user on the system
 * @param baseUrl - the API base URL
 */
async function getMyProjects(baseUrl: string = apiBaseUrl): Promise<Project[]> {
  return await authenticatedFetch(`${baseUrl}/me/projects`);
}

/**
 * Extracts the error message from the response
 *
 * @param response - the response from which to extract the error message
 */
async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data["detail"] || JSON.stringify(data);
  } catch (error) {
    return await response.text();
  }
}

/**
 * A wrapper around the fetch functionality that adds
 * authentication in it
 *
 * @param input - the input to be passed to fetch
 * @param init - the init object to  pass to fetch
 * @returns - the response from the backend
 */
async function authenticatedFetch<T>(
  input: string | URL | globalThis.Request,
  init: RequestInit = {}
): Promise<T> {
  init.credentials = "same-origin";
  init.cache;
  const response = await fetch(input, init);
  if (response.ok) {
    return await response.json();
  }

  throw new Error(await extractErrorMessage(response));
}
