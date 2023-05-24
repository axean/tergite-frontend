const ApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
if only period is given then the function returns the string 'period'.
if from and to are also given then the string of the form 'period?from=<from>&to=<to>' is returned
if period is undefined then '' is returned
 */
function formatPeriod(period?: { from?: string; to?: string }): string {
	return period ? `period${period.from ? `?from=${period.from}&to=${period.to}` : ''}` : '';
}

/**
 Routes for the API
*/
const ApiRoutes: {
	statuses: string;
	devices: string;
	device: (id: string) => string;
	type1: (id: string) => string;
	type2: (id: string, period?: { from?: string; to?: string }) => string;
	type3: (id: string, period?: { from?: string; to?: string }) => string;
	type4_domain: (id: string, period?: { from?: string; to?: string }) => string;
	type4_codomain: (id: string, period?: { from?: string; to?: string }) => string;
	type5: (id: string, period?: { from?: string; to?: string }) => string;
} = {
	devices: `${ApiBaseUrl}/devices`,
	statuses: `${ApiBaseUrl}/devices/online_statuses`,
	device: (id) => `${ApiBaseUrl}/devices/${id}`,
	type1: (id) => `${ApiBaseUrl}/devices/${id}/type1`,
	type2: (id, period) => `${ApiBaseUrl}/devices/${id}/type2/${formatPeriod(period)}`,
	type3: (id, period) => `${ApiBaseUrl}/devices/${id}/type3/${formatPeriod(period)}`,
	type4_domain: (id, period) =>
		`${ApiBaseUrl}/devices/${id}/type4_domain/${formatPeriod(period)}`,
	type4_codomain: (id, period) =>
		`${ApiBaseUrl}/devices/${id}/type4_codomain/${formatPeriod(period)}`,
	type5: (id, period) => `${ApiBaseUrl}/devices/${id}/type5/${formatPeriod(period)}`
};

export default ApiRoutes;
