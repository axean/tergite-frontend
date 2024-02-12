import ApiRoutes from './ApiRoutes';

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
