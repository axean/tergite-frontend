import { FetchQueryOptions, QueryClient } from "@tanstack/react-query";
import {
  AppState,
  Device,
  DeviceCalibration,
  ErrorInfo,
  Job,
  Oauth2RedirectResponse,
  Project,
} from "./types";

export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
const shouldShowMocks =
  import.meta.env.VITE_SHOW_MOCKS == "true" && import.meta.env.DEV;

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
 * Extracts the error from the response
 *
 * @param response - the response from which to extract the error message
 */
async function extractError(response: Response): Promise<ErrorInfo> {
  let message = "unknown http error";
  try {
    const data = await response.json();
    message = data["detail"] || JSON.stringify(data);
  } catch (error) {
    message = await response.text();
  }

  const error = new Error(message) as ErrorInfo;
  error.status = response.status;
  return error;
}

/**
 * Login to the backend
 * @param email - the email of the user
 * @param baseUrl - the base URL of the API
 * @param nextUrl - the next URL after login
 */
export async function login(
  email: string,
  baseUrl: string = apiBaseUrl,
  nextUrl: string = window.location.origin
) {
  const emailDomain = email.split("@")[1];
  const nextUrlQuery = nextUrl ? `&next=${nextUrl}` : "";
  // FIXME: Passing the email just for the mock. Remove this in production
  const mockQuery = shouldShowMocks ? `&email=${email}` : "";
  const url = `${baseUrl}/auth/providers?domain=${emailDomain}${nextUrlQuery}${mockQuery}`;
  const { authorization_url } =
    await authenticatedFetch<Oauth2RedirectResponse>(url);
  await authenticatedFetch(authorization_url);
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
  options: { baseUrl?: string; nextUrl?: string } = {}
) {
  const { baseUrl = apiBaseUrl, nextUrl = window.location.origin } = options;
  appState.clear();
  queryClient.clear();
  const url = `${baseUrl}/auth/logout?next=${nextUrl}`;
  await authenticatedFetch(url);
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
  init.credentials = "include";
  init.redirect = "follow";

  const response = await fetch(input, init);
  if (response.redirected) {
    // FIXME: Use the mock fetch so as to use the MSW worker if mocks should be shown
    // and the new url is not one served by the react router
    if (shouldShowMocks && !response.url.startsWith(window.location.origin)) {
      return await authenticatedFetch(response.url);
    } else {
      window.location.replace(response.url);
      // @ts-expect-error
      return;
    }
  }

  if (response.ok) {
    const contentType = response.headers.get("Content-Type");
    if (contentType === "application/json") {
      return await response.json();
    } else {
      // if response is text, just redirect to it
      window.location.href = response.url;
      // @ts-expect-error
      return;
    }
  }

  throw await extractError(response);
}
