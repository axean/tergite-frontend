/**Service functions focussing on the browser side */

import { API } from '@/types';

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
	const resp = await fetch(input, { ...init, credentials: 'include' });

	if (!resp.ok) {
		const error: API.EnhancedError = new Error('unexpected server error');
		error.status = resp.status;
		error.message =
			(await getJsonErrorResponse(resp)) ||
			(await getTextErrorResponse(resp)) ||
			'unexpected server error';

		throw error;
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
export async function post<T>(input: RequestInfo | URL, { arg }: { arg?: T } = {}): Promise<T> {
	const body = JSON.stringify(arg ?? {});

	const resp = await fetch(input, {
		method: 'POST',
		body,
		cache: 'no-store',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' }
	});

	if (!resp.ok) {
		const error: API.EnhancedError = new Error('unexpected server error');
		error.status = resp.status;
		error.message =
			(await getJsonErrorResponse(resp)) ||
			(await getTextErrorResponse(resp)) ||
			'unexpected server error';

		throw error;
	}

	return await resp.json();
}

/**
 * updates data of type T via an HTTP request
 *
 * @param input - the same as fetch
 * @param init - the value sent by the useSWRMutation
 * @returns the item got from the request
 */
export async function updater<T>(input: RequestInfo | URL, { arg }: { arg?: T } = {}): Promise<T> {
	const body = JSON.stringify(arg ?? {});

	const resp = await fetch(input, {
		method: 'PATCH',
		body,
		cache: 'no-store',
		credentials: 'include',
		headers: { 'Content-Type': 'application/json' }
	});

	if (!resp.ok) {
		const error: API.EnhancedError = new Error();
		error.status = resp.status;
		error.message =
			(await getJsonErrorResponse(resp)) ||
			(await getTextErrorResponse(resp)) ||
			'unexpected server error';

		throw error;
	}

	return await resp.json();
}

/**
 * Deletes data via an HTTP request
 *
 * @param input - the same as fetch
 * @param init - the value sent by the useSWRMutation
 * @returns the url that was used to make the request
 */
export async function destroyer(input: RequestInfo | URL, { arg }: { arg?: any } = {}) {
	const resp = await fetch(input, {
		method: 'DELETE',
		cache: 'no-store',
		credentials: 'include'
	});

	if (!resp.ok) {
		const error: API.EnhancedError = new Error('unexpected server error');
		error.status = resp.status;
		error.message =
			(await getJsonErrorResponse(resp)) ||
			(await getTextErrorResponse(resp)) ||
			'unexpected server error';

		throw error;
	}

	return { url: input };
}

/**
 * Raises or throws error
 *
 * This is a useful utility to reraise errors to be caught by error handlers
 * @param err - the error to raise
 */
export function raise(err: API.EnhancedError) {
	throw err;
}

/**
 * Retrieves the error message from the JSON HTTP response
 *
 * @param resp - the response from the HTTP request
 * @returns - the error message or undefined if the response is not a JSON
 */
async function getJsonErrorResponse(resp: Response): Promise<string | undefined> {
	let msg: string | undefined = undefined;

	try {
		const data = await resp.json();
		msg = data.detail || JSON.stringify(data);
	} catch (e) {
		console.error('error extracting JSON error response: ', e);
	}

	return msg;
}

/**
 * Retrieves the error message from the text HTTP response
 *
 * @param resp - the response from the HTTP request
 * @returns - the error message or undefined if the response is not a text
 */
async function getTextErrorResponse(resp: Response): Promise<string | undefined> {
	let msg: string | undefined = undefined;

	try {
		msg = await resp.text();
	} catch (e) {
		console.error('error extracting text error response: ', e);
	}

	return msg;
}
