/**Service functions focussing on the browser side */

/**
 * Retreives the currently loggedin user
 *
 * @returns the current logged in user
 */
export async function getCurrentUser(): Promise<API.User> {
	const resp = await fetch('/api/me');
	if (!resp.ok) {
		throw new Error('error connecting with server.');
	}

	const data = await resp.json();
	if (!data.id) {
		throw new Error(data?.detail || data);
	}

	return data;
}

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

