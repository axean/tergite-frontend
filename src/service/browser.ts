/**Service functions focussing on the browser side */

/**
 * Fetches data via an HTTP request
 *
 * @param input - the same as fetch
 * @param init - the same as fetch
 * @returns the item got from the request
 */
export async function fetcher<T>(
	input: RequestInfo | URL,
	init?: RequestInit | undefined
): Promise<T> {
	const resp = await fetch(input, init);

	if (!resp.ok) {
		const data = await resp.json();
		const { detail = 'unexpected server error' } = data;
		throw new Error(detail);
	}

	return await resp.json();
}

/**
 * Poster posts data of type T via an HTTP request
 *
 * @param input - the same as fetch
 * @param init - the value sent by the useSWRMutation
 * @returns the item got from the request
 */
export async function post<T>(input: RequestInfo | URL, { arg }: { arg?: T } = {}) {
	const body = JSON.stringify(arg ?? {});

	const resp = await fetch(input, { method: 'POST', body, cache: 'no-store' });

	if (!resp.ok) {
		try {
			const data = await resp.json();
			const { detail = 'unexpected server error' } = data;
			throw new Error(detail);
		} catch (error) {
			throw new Error('unexpected server error');
		}
	}

	return await resp.json();
}
