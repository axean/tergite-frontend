import { QueryClient, queryOptions } from "@tanstack/react-query";
import {
  type AppState,
  type Device,
  type DeviceCalibration,
  type ErrorInfo,
  type Job,
  type AuthProviderResponse,
  type Project,
  type AppTokenCreationRequest,
  type AppTokenCreationResponse,
  type PaginatedData,
  type AppToken,
  type AppTokenUpdateRequest,
  QpuTimeExtensionPostBody,
  QpuTimeExtensionUserRequest,
  User,
  UserRequestStatus,
} from "../../types";
import { normalizeCalibrationData, extendAppToken } from "./utils";

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
 * @param options - extra options for filtering
 *          - baseUrl - the base URL of the API
 */
export function singleDeviceQuery(
  name: string,
  options: { baseUrl?: string } = {}
) {
  const { baseUrl = apiBaseUrl } = options;
  return queryOptions({
    queryKey: [baseUrl, "devices", name],
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
 * the devices query for using with react query
 */
export const currentUserQuery = queryOptions({
  queryKey: [apiBaseUrl, "me"],
  queryFn: async () => await getCurrentUser(),
});

/**
 * the single device's calibration query for using with react query
 * @param options - extra options for filtering
 *          - baseUrl - the base URL of the API
 */
export function singleDeviceCalibrationQuery(
  name: string,
  options: { baseUrl?: string } = {}
) {
  const { baseUrl = apiBaseUrl } = options;
  return queryOptions({
    queryKey: [baseUrl, "calibrations", name],
    queryFn: async () => await getCalibrationsForDevice(name),
    refetchInterval,
  });
}

/**
 * the my jobs query for using with react query
 * @param options - extra options for filtering the jobs
 *          - baseUrl - the base URL of the API
 */
export function myJobsQuery(
  options: { project_id?: string; baseUrl?: string } = {}
) {
  const { project_id = "", baseUrl = apiBaseUrl } = options;
  return queryOptions({
    queryKey: [baseUrl, "me", "jobs", project_id],
    queryFn: async () => await getMyJobs(options),
    refetchInterval,
  });
}

/**
 * the my tokens query for using with react query
 * @param options - extra options for filtering the tokens
 *            - baseUrl - the base URL of the API
 *            - project_ext_id - the external ID of the tokens' project
 *            - projectList - List of all available projects
 */
export function myTokensQuery(options: {
  project_ext_id?: string;
  projectList: Project[];
  baseUrl?: string;
}) {
  const { project_ext_id, projectList, baseUrl = apiBaseUrl } = options;
  const queryKey = [baseUrl, "me", "tokens", project_ext_id];

  return queryOptions({
    queryKey,
    queryFn: async () => {
      const rawTokens = await getMyTokens({ project_ext_id });
      const projectMap: { [k: string]: Project } = Object.fromEntries(
        projectList.map((v) => [v.ext_id, { ...v }])
      );

      return rawTokens.map((v) =>
        extendAppToken(v, projectMap[v.project_ext_id])
      );
    },
    refetchInterval,
  });
}

/**
 * the query for getting the qpu time requests for my projects using with react query
 * @param options - extra options for filtering the tokens
 *            - baseUrl - the base URL of the API
 *            - projectList - List of all available projects
 */
export function myProjectsQpuTimeRequestsQuery(options: {
  status?: UserRequestStatus;
  projects: Project[];
  baseUrl?: string;
}) {
  const { status, projects, baseUrl = apiBaseUrl } = options;
  const projectIds = projects.map((v) => v.id).sort();
  const queryKey = [baseUrl, "admin", "qpu-time-requests", projectIds, status];

  return queryOptions({
    queryKey,
    queryFn: async () =>
      await getProjectQpuTimeRequests(baseUrl, projectIds, status),
    refetchInterval,
  });
}

/**
 * Refreshes the queries for the tokens from the API
 *
 * @param queryClient - the query client for making queries
 * @param options - the options including:
 *          - baseUrl - the base URL of the API
 */
export function refreshMyTokensQueries(
  queryClient: QueryClient,
  options: {
    baseUrl?: string;
  } = {}
) {
  const { baseUrl = apiBaseUrl } = options;
  queryClient.invalidateQueries({ queryKey: [baseUrl, "me", "tokens"] });
}

/**
 * Refreshes the queries for the projects from the API
 *
 * @param queryClient - the query client for making queries
 * @param options - the options including:
 *          - baseUrl - the base URL of the API
 */
export function refreshMyProjectsQueries(
  queryClient: QueryClient,
  options: {
    baseUrl?: string;
  } = {}
) {
  const { baseUrl = apiBaseUrl } = options;
  queryClient.invalidateQueries({ queryKey: [baseUrl, "me", "projects"] });
}

/**
 * Refreshes the queries for the QPU time requests from the API
 *
 * @param queryClient - the query client for making queries
 * @param options - the options including:
 *          - baseUrl - the base URL of the API
 */
export function refreshMyProjectsQpuTimeRequestsQueries(
  queryClient: QueryClient,
  options: {
    baseUrl?: string;
  } = {}
) {
  const { baseUrl = apiBaseUrl } = options;
  queryClient.invalidateQueries({
    queryKey: [baseUrl, "admin", "qpu-time-requests"],
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
 * @param payload - the payload for a new app token
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
  return await authenticatedFetch(`${baseUrl}/me/tokens/`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Updates the app token's lifespan
 * @param id - the id for the token
 * @param payload - the payload for the update
 * @param options - the options including:
 *          - baseUrl - the base URL of the API
 */
export async function updateAppToken(
  id: string,
  payload: AppTokenUpdateRequest,
  options: {
    baseUrl?: string;
  } = {}
): Promise<AppToken> {
  const { baseUrl = apiBaseUrl } = options;
  return await authenticatedFetch(`${baseUrl}/me/tokens/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Requests for more QPU time for the given project
 *
 * @param payload - the body to be sent in the request
 * @param options - the options including:
 *          - baseUrl - the base URL of the API
 */
export async function requestQpuTimeExtension(
  payload: QpuTimeExtensionPostBody,
  options: {
    baseUrl?: string;
  } = {}
): Promise<QpuTimeExtensionUserRequest> {
  const { baseUrl = apiBaseUrl } = options;
  return await authenticatedFetch(`${baseUrl}/admin/qpu-time-requests`, {
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
 * @returns - the auth provider for the given email or raises a 404 error
 */
export async function getAuthProviders(
  email: string,
  options: {
    baseUrl?: string;
  } = {}
): Promise<AuthProviderResponse[]> {
  const { baseUrl = apiBaseUrl } = options;
  const emailDomain = email.split("@")[1];
  const url = `${baseUrl}/auth/providers?domain=${emailDomain}`;
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
 * Deletes the token for the current user on the system
 * @param id of the token
 * @param options - extra options for querying the jobs
 *           - baseUrl - the API base URL; default apiBaseUrl
 */
export async function deleteMyToken(
  id: string,
  options: { baseUrl?: string } = {}
): Promise<void> {
  const { baseUrl = apiBaseUrl } = options;
  await authenticatedFetch(
    `${baseUrl}/me/tokens/${id}`,
    {
      method: "delete",
    },
    { isJsonOutput: false }
  );
}

/**
 * Deletes the project for the current user on the system
 * @param id of the project
 * @param options - extra options for querying the jobs
 *           - baseUrl - the API base URL; default apiBaseUrl
 */
export async function deleteMyProject(
  id: string,
  options: { baseUrl?: string } = {}
): Promise<void> {
  const { baseUrl = apiBaseUrl } = options;
  await authenticatedFetch(
    `${baseUrl}/me/projects/${id}`,
    {
      method: "delete",
    },
    { isJsonOutput: false }
  );
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
 * Retrieve the user who is currently logged in on the system
 * @param baseUrl - the API base URL
 */
async function getCurrentUser(baseUrl: string = apiBaseUrl): Promise<User> {
  return await authenticatedFetch(`${baseUrl}/me`);
}

/**
 * Retrieves the calibration data for the devices on the system
 * @param baseUrl - the API base URL
 */
async function getCalibrations(
  baseUrl: string = apiBaseUrl
): Promise<DeviceCalibration[]> {
  const rawResult = await authenticatedFetch<DeviceCalibration[]>(
    `${baseUrl}/calibrations`
  );
  return rawResult.map(normalizeCalibrationData);
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
  const rawResult = await authenticatedFetch<DeviceCalibration>(
    `${baseUrl}/calibrations/${name}`
  );
  return normalizeCalibrationData(rawResult);
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
 * Retrieves the app tokens for the current user on the system
 * @param options - extra options for querying the app tokens
 *      e.g. - project external id
 *           - baseUrl - the API base URL; default apiBaseUrl
 */
async function getMyTokens(
  options: { project_ext_id?: string; baseUrl?: string } = {}
): Promise<AppToken[]> {
  const { project_ext_id, baseUrl = apiBaseUrl } = options;
  const query = project_ext_id ? `?project_ext_id=${project_ext_id}` : "";
  const { data } = await authenticatedFetch<PaginatedData<AppToken[]>>(
    `${baseUrl}/me/tokens${query}`
  );
  return data;
}

/**
 * Retrieves the projects for the current user on the system
 * @param baseUrl - the API base URL
 */
async function getMyProjects(baseUrl: string = apiBaseUrl): Promise<Project[]> {
  const { data } = await authenticatedFetch<PaginatedData<Project[]>>(
    `${baseUrl}/me/projects/`
  );
  return data;
}

/**
 * Retrieves the devices on the system
 * @param baseUrl - the API base URL
 * @param [projectIds=[]] - the ids of the projects whose requests are to be returned
 */
async function getProjectQpuTimeRequests(
  baseUrl: string = apiBaseUrl,
  projectIds: string[] = [],
  status?: UserRequestStatus
): Promise<QpuTimeExtensionUserRequest[]> {
  const queryParams = projectIds.map((v) => `project_id=${v}`);
  if (status) {
    queryParams.push(`status=${status}`);
  }

  const queryString = queryParams.join("&");
  const { data } = await authenticatedFetch<
    PaginatedData<QpuTimeExtensionUserRequest[]>
  >(`${baseUrl}/admin/qpu-time-requests?${queryString}`);

  return data;
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
 * @param options - the extra options that are not passed to fetch
 *            - isJsonOutput: whether the output is JSON or not
 * @returns - the response from the backend
 */
async function authenticatedFetch<T>(
  input: string | URL | globalThis.Request,
  init: RequestInit = {},
  options: { isJsonOutput?: boolean } = {}
): Promise<T> {
  const response = await fetch(input, {
    ...init,
    credentials: "include",
  });

  if (response.ok) {
    const { isJsonOutput = true } = options;
    return isJsonOutput ? await response.json() : await response.text();
  }

  throw await extractError(response);
}
