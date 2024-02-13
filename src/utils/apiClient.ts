export const ApiRoutes = getApiRoutes();

/**
if only period is given then the function returns the string 'period'.
if from and to are also given then the string of the form 'period?from=<from>&to=<to>' is returned
if period is undefined then '' is returned
 */
function formatPeriod(period?: { from?: string; to?: string }): string {
	return period ? `period${period.from ? `?from=${period.from}&to=${period.to}` : ''}` : '';
}

/**
 Gets the Api Routes given a particular baseUrl
*/
export function getApiRoutes(baseUrl: string = process.env.NEXT_PUBLIC_API_BASE_URL): IApiRoutes {
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
		type5: (id, period) => `${baseUrl}/devices/${id}/type5/${formatPeriod(period)}`
	};
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
}) {
	const res = await fetch(
		`${
			ApiRoutes.devices
		}/${backend}/${type}/period?from=${timeFrom.toISOString()}&to=${timeTo.toISOString()}`
	);
	const resJSON = await res.json();

	if (!res.ok) {
		throw Error(resJSON['detail']);
	}

	return resJSON;
}

interface IApiRoutes {
	statuses: string;
	devices: string;
	device: (id: string) => string;
	type1: (id: string) => string;
	type2: (id: string, period?: { from?: string; to?: string }) => string;
	type3: (id: string, period?: { from?: string; to?: string }) => string;
	type4_domain: (id: string, period?: { from?: string; to?: string }) => string;
	type4_codomain: (id: string, period?: { from?: string; to?: string }) => string;
	type5: (id: string, period?: { from?: string; to?: string }) => string;
}
