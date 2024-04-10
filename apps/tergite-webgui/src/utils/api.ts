/**
 * Utility for querying the backend
 */

import { fetcher, post } from './browser';

interface IApiRoutes {
	baseUrl: string;
	statuses: string;
	devices: string;
	recalibration: string;
	mlExperiments: string;
	internalApi: string;
	cryostat: string;
	device: (id: string) => string;
	type1: (id: string) => string;
	type2: (id: string, period?: { from?: string; to?: string }) => string;
	type3: (id: string, period?: { from?: string; to?: string }) => string;
	type4_domain: (id: string, period?: { from?: string; to?: string }) => string;
	type4_codomain: (id: string, period?: { from?: string; to?: string }) => string;
	type5: (id: string, period?: { from?: string; to?: string }) => string;
}

let apiConfigs: API.Response.Configs;
let apiRoutes: IApiRoutes;

/**
 Gets the Api Routes given a particular baseUrl
*/
export function getApiRoutes(baseUrl: string): IApiRoutes {
	return {
		devices: `${baseUrl}/devices`,
		statuses: `${baseUrl}/devices/online_statuses`,
		device: (id) => `${baseUrl}/devices/${id}`,
		type1: (id) => `${baseUrl}/devices/${id}/type1`,
		type2: (id, period) => `${baseUrl}/devices/${id}/type2/${formatPeriod(period)}`,
		type3: (id, period) => `${baseUrl}/devices/${id}/type3/${formatPeriod(period)}`,
		type4_domain: (id, period) =>
			`${baseUrl}/devices/${id}/type4_domain/${formatPeriod(period)}`,
		type4_codomain: (id, period) =>
			`${baseUrl}/devices/${id}/type4_codomain/${formatPeriod(period)}`,
		type5: (id, period) => `${baseUrl}/devices/${id}/type5/${formatPeriod(period)}`,
		baseUrl,
		recalibration: `${baseUrl}/v2/recalibration`,
		mlExperiments: `${baseUrl}/v2/experiments/ml-example`,
		internalApi: `/api`,
		cryostat: `${baseUrl}/cryostat`
	};
}

/**
 * Returns the details of the given backend
 *
 * @param backend - the backend of the quantum computer
 */
export async function getDevice(backend: string): Promise<API.Response.DeviceDetail> {
	await setApiRoutesIfUndefined();
	return await fetcher(`${apiRoutes.devices}/${backend}`);
}

/**
 * Returns the table details of the given backend
 *
 * @param backend - the backend of the quantum computer
 */
export async function getDeviceTableData(backend: string): Promise<API.Response.DeviceDetail> {
	await setApiRoutesIfUndefined();
	return await fetcher(`${apiRoutes.devices}/${backend}/data`);
}

/**
 * Returns the state discrimination of the given backend when not tuned
 *
 * @param backend - the backend of the quantum computer
 */
export async function getUntunedStateDiscrimination(
	backend: string
): Promise<API.Response.Classification> {
	await setApiRoutesIfUndefined();
	return await fetcher(
		`${apiRoutes.recalibration}/classifications/${backend}?is_calibrated=false`
	);
}

/**
 * Fetches the visualization of a given backend
 * @returns - the visualization data of the given backend
 */
export async function fetchVizualitationData({
	backend,
	timeFrom,
	timeTo,
	type
}: {
	backend: string;
	timeFrom: Date;
	timeTo: Date;
	type: string;
}): Promise<any> {
	await setApiRoutesIfUndefined();
	const url = `${
		apiRoutes.devices
	}/${backend}/${type}/period?from=${timeFrom.toISOString()}&to=${timeTo.toISOString()}`;
	return await fetcher(url);
}

/**
 * Returns the type1 data for the given backend
 *
 * @param backend - the backend of the quantum computer
 */
export async function getType1DeviceData(backend: string): Promise<API.Response.Type1> {
	await setApiRoutesIfUndefined();
	return await fetcher(`${apiRoutes.devices}/${backend}/type1`);
}

/**
 * Returns the type5 data for the given backend
 *
 * @param backend - the backend of the quantum computer
 */
export async function getType5DeviceData(backend: string): Promise<any> {
	await setApiRoutesIfUndefined();
	return await fetcher(`${apiRoutes.devices}/${backend}/type5`);
}

/**
 * Returns the type4_domain data for the given backend
 *
 * @param backend - the backend of the quantum computer
 */
export async function getType4DomainDeviceData(backend: string): Promise<API.Response.Type4Domain> {
	await setApiRoutesIfUndefined();
	return await fetcher(`${apiRoutes.devices}/${backend}/type4_domain`);
}

/**
 * Returns the type4_coomain data for the given backend
 *
 * @param backend - the backend of the quantum computer
 */
export async function getType4CodomainDeviceData(
	backend: string
): Promise<API.Response.Type4Codomain> {
	await setApiRoutesIfUndefined();
	return await fetcher(`${apiRoutes.devices}/${backend}/type4_codomain`);
}

/**
 * Returns the state discrimination of the given backend for the given jobId
 *
 * @param backend - the backend of the quantum computer
 * @param jobId - the job id of the reclassification job that initiated it
 * @param retryCount - number of times to retry the request if it returns an error
 */
export async function getLatestStateDiscrimination(
	backend: string,
	jobId: string,
	retryCount: number = 0
): Promise<API.Response.Classification> {
	let query_string = '?is_calibrated=true';
	if (jobId) {
		query_string = `${query_string}&job_id=${jobId}`;
	}

	await setApiRoutesIfUndefined();
	const url = `${apiRoutes.recalibration}/classifications/${backend}${query_string}`;
	const maxAttempts = retryCount + 1;
	let error: API.EnhancedError = new Error('no request was made');

	for (let i = 0; i < maxAttempts; i++) {
		try {
			return await fetcher(url);
		} catch (err) {
			error = err;
		}
	}

	throw error;
}

/**
 * Trigger tune up of the given backend
 *
 * @param backend - the backend of the quantum computer
 */
export async function triggerTuneUp(backend: string): Promise<API.Response.RemoteTaskResponse> {
	await setApiRoutesIfUndefined();
	return await post(`${apiRoutes.recalibration}/reclassify/${backend}`);
}

/**
 * Gets all the devices that are available from the API
 */
export async function getAllDevices(): Promise<API.Response.DeviceDetail[]> {
	await setApiRoutesIfUndefined();
	return await fetcher(`${apiRoutes.devices}/`);
}

/**
 * Gets all the calibrations that are available from the API
 */
export async function getAllUncalibratedCalibrations(): Promise<API.Response.Calibration[]> {
	await setApiRoutesIfUndefined();
	return await fetcher(`${apiRoutes.recalibration}/calibrations/?is_calibrated=False`);
}

/**
 * Returns the default state discrimination data for the given backend, in case the normal request fails.
 *
 * This response is got from within the Nextjs API not the external API
 *
 * @param backend - the backend of the quantum computer
 * @param jobId - the job id of the reclassification job that initiated it
 */
export async function getDefaultStateDiscrimination(
	backend: string
): Promise<API.Response.Classification> {
	await setApiRoutesIfUndefined();
	return await fetcher(`${apiRoutes.internalApi}/classifications/${backend}`);
}

/**
 * Gets all the ML experiments starting with the latest one
 */
export async function getPreTaggedMLExperiment(): Promise<API.Response.MLExperiment> {
	await setApiRoutesIfUndefined();
	return await fetcher(`${apiRoutes.mlExperiments}/pre-tagged-data`);
}

/**
 * Gets all the ML experiments starting with the latest one
 */
export async function getAllMLExperiments(): Promise<API.Response.MLExperiment[]> {
	await setApiRoutesIfUndefined();
	return await fetcher(`${apiRoutes.mlExperiments}/`);
}

/**
 * Returns the experiment's results
 *
 * @param experimentId - the id of the experiment
 */
export async function getMLExperiment(experimentId: string): Promise<API.Response.MLExperiment> {
	await setApiRoutesIfUndefined();
	return await fetcher(`${apiRoutes.mlExperiments}/${experimentId}`);
}

/**
 * Returns the results of the default ML Experiment
 * FIXME: this is a backup in case ML experiment results are unreliable.
 */
export async function getDefaultMLExperiment(): Promise<API.Response.MLExperiment> {
	await setApiConfigsIfUndefined();
	return await getMLExperiment(apiConfigs.correctMLExperimentID);
}

/**
 *  Returns the cryostat temperature data
 *
 * @param deviceId - the id of the device whose temperature is to be got
 * @param channel - the channel being monitored
 * @param from_ - the datetime stamp which is the starting point for the data
 * @param to_ - the timestamp which is the last point for the data
 * @returns - the list of temperature datapoints for the given device at the given channel
 */
export async function getCryostatTemperature(
	deviceId: string,
	channel: number,
	from_?: string,
	to_?: string
): Promise<API.Response.ParsedCryostatTempDataPoint[]> {
	await setApiRoutesIfUndefined();
	let url = `${apiRoutes.cryostat}/${deviceId}/temperature/channel/${channel}?`;

	if (from_) {
		url = `${url}from_param=${from_}&`;
	}

	if (to_) {
		url = `${url}to_param=${to_}`;
	}

	const response: API.Response.CryostatTempDataPoint[] = await fetcher(url);
	return response.map((v) => ({ ...v, datetime: Date.parse(v.datetime) }));
}

/**
 *  Returns dummy cryostat temperature data
 *
 * FIXME: get rid of this
 * @param channel - the channel being monitored
 * @param from_ - the datetime stamp which is the starting point for the data
 * @param to_ - the timestamp which is the last point for the data
 * @returns - the list of temperature datapoints for the given device at the given channel
 */
export async function getDefaultCryostatTemperature(
	channel: number,
	from_?: string,
	to_?: string
): Promise<API.Response.ParsedCryostatTempDataPoint[]> {
	await setApiRoutesIfUndefined();
	let url = `${apiRoutes.internalApi}/temperature/${channel}?`;

	if (from_) {
		url = `${url}from_param=${from_}&`;
	}

	if (to_) {
		url = `${url}to_param=${to_}`;
	}

	const response: API.Response.CryostatTempDataPoint[] = await fetcher(url);
	return response.map((v) => ({ ...v, datetime: Date.parse(v.datetime) }));
}

/**
 * Returns the current logged in user
 */
export async function getMe(): Promise<API.User> {
	await setApiRoutesIfUndefined();
	return await fetcher(`${apiRoutes.internalApi}/me`);
}

/**
 * Returns the current logged in user
 */
export async function logoutOnClient(): Promise<API.StatusMessage> {
	await setApiRoutesIfUndefined();
	return await post(`${apiRoutes.internalApi}/logout`);
}

/**
 * Returns the configurations for this application
 */
export async function getConfigs(): Promise<API.Response.Configs> {
	if (apiConfigs == undefined) {
		apiConfigs = await fetcher('api/configs');
	}
	return { ...apiConfigs };
}

/**
 * Ensures that the API routes is defined
 */
async function setApiRoutesIfUndefined() {
	if (apiRoutes == undefined) {
		await setApiConfigsIfUndefined();
		apiRoutes = getApiRoutes(apiConfigs.mssBaseUrl);
	}
}

/**
 * Ensures that the API configs e.g. MSS backend etc, are defined
 */
async function setApiConfigsIfUndefined() {
	if (apiConfigs == undefined) {
		apiConfigs = await fetcher('api/configs');
	}
}

/**
if only period is given then the function returns the string 'period'.
if from and to are also given then the string of the form 'period?from=<from>&to=<to>' is returned
if period is undefined then '' is returned
 */
function formatPeriod(period?: { from?: string; to?: string }): string {
	return period ? `period${period.from ? `?from=${period.from}&to=${period.to}` : ''}` : '';
}
