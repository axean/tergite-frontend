import { QueryClient, queryOptions } from "@tanstack/react-query";
import {
  AppState,
  Device,
  DeviceCalibration,
  ErrorInfo,
  Job,
  AuthProviderResponse,
  Project,
  AppTokenCreationRequest,
  AppTokenCreationResponse,
} from "../../types";

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
export const refetchInterval = parseFloat(
  import.meta.env.VITE_REFETCH_INTERVAL_MS || "120000"
); // default: 2 minutes

/**
 * the devices query for using with react query
 */
export const devicesQuery = queryOptions({
  queryKey: [apiBaseUrl, "devices"],
  queryFn: async () => await getDevices(),
  refetchInterval,
});

/**
 * the single device query for using with react query
 */
export function singleDeviceQuery(name: string) {
  return queryOptions({
    queryKey: [apiBaseUrl, "devices", name],
    queryFn: async () => await getDeviceDetail(name),
    refetchInterval,
  });
}

/**
 * the devices query for using with react query
 */
export const calibrationsQuery = queryOptions({
  queryKey: [apiBaseUrl, "calibrations"],
  queryFn: async () => await getCalibrations(),
  refetchInterval,
});

/**
 * the single device's calibration query for using with react query
 */
export function singleDeviceCalibrationQuery(name: string) {
  return queryOptions({
    queryKey: [apiBaseUrl, "calibrations", name],
    queryFn: async () => await getCalibrationsForDevice(name),
    refetchInterval,
  });
}

/**
 * the my jobs query for using with react query
 * @param options - extra options for filtering the jobs
 */
export function myJobsQuery(options: { project_id?: string } = {}) {
  const { project_id = "" } = options;
  return queryOptions({
    queryKey: [apiBaseUrl, "me", "jobs", project_id],
    queryFn: async () => await getMyJobs(options),
    refetchInterval,
  });
}

/**
 * the my projects query for using with react query
 */
export const myProjectsQuery = queryOptions({
  queryKey: [apiBaseUrl, "me", "projects"],
  queryFn: async () => await getMyProjects(),
  refetchInterval,
});

/**
 * Generates a new app token
 * @param - the payload for a new app token
 * @param options - the options for loging in including:
 *          - baseUrl - the base URL of the API
 */
export async function createAppToken(
  payload: AppTokenCreationRequest,
  options: {
    baseUrl?: string;
  } = {}
): Promise<AppTokenCreationResponse> {
  const { baseUrl = apiBaseUrl } = options;
  return await authenticatedFetch(`${baseUrl}/me/tokens`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Gets the auth providers that the given email address might find possible to login with
 * @param email - the email of the user
 * @param options - the options for loging in including:
 *          - baseUrl - the base URL of the API
 *          - nextUrl - the next URL after login
 * @returns - the auth provider for the given email or raises a 404 error
 */
export async function getAuthProviders(
  email: string,
  options: {
    baseUrl?: string;
    nextUrl?: string;
  } = {}
): Promise<AuthProviderResponse[]> {
  const { baseUrl = apiBaseUrl, nextUrl = window.location.origin } = options;
  const emailDomain = email.split("@")[1];
  const nextUrlQuery = nextUrl ? `&next=${nextUrl}` : "";
  const url = `${baseUrl}/auth/providers?domain=${emailDomain}${nextUrlQuery}`;
  return await authenticatedFetch<AuthProviderResponse[]>(url);
}

/**
 * Logs out the current user
 *
 * @param queryClient - the react query client whose cache is to be reset
 * @param appState - the app state which is to be cleared
 * @param options - other options for making the query
 */
export async function logout(
  queryClient: QueryClient,
  appState: AppState,
  options: { baseUrl?: string } = {}
) {
  const { baseUrl = apiBaseUrl } = options;
  appState.clear();
  queryClient.clear();
  await authenticatedFetch(`${baseUrl}/auth/logout`, { method: "post" });
}

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
 * @param options - extra options for querying the jobs
 *      e.g. - project id
 *           - baseUrl - the API base URL; default apiBaseUrl
 */
async function getMyJobs(
  options: { project_id?: string; baseUrl?: string } = {}
): Promise<Job[]> {
  const { project_id, baseUrl = apiBaseUrl } = options;
  const query = project_id ? `?project_id=${project_id}` : "";
  return await authenticatedFetch(`${baseUrl}/me/jobs${query}`);
}

/**
 * Retrieves the projects for the current user on the system
 * @param baseUrl - the API base URL
 */
async function getMyProjects(baseUrl: string = apiBaseUrl): Promise<Project[]> {
  return await authenticatedFetch(`${baseUrl}/me/projects`);
}

/**
 * Extracts the error from the response
 *
 * @param response - the response from which to extract the error message
 */
async function extractError(response: Response): Promise<ErrorInfo> {
  let message = "unknown http error";
  try {
    const data = await response.clone().json();
    message = data["detail"] || JSON.stringify(data);
  } catch (error) {
    message = await response.text();
  }

  const error = new Error(message) as ErrorInfo;
  error.status = response.status;
  return error;
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
  const response = await fetch(input, {
    ...init,
    credentials: "include",
  });

  if (response.ok) {
    return await response.json();
  }

  throw await extractError(response);
}
