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

		try {
			const data = await resp.json();
			const { detail = 'unexpected server error' } = data;
			error.message = detail;
		} finally {
			throw error;
		}
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
		credentials: 'include'
	});

	if (!resp.ok) {
		const error: API.EnhancedError = new Error('unexpected server error');
		error.status = resp.status;

		try {
			const data = await resp.json();
			const { detail = 'unexpected server error' } = data;
			error.message = detail;
		} finally {
			throw error;
		}
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
		credentials: 'include'
	});

	if (!resp.ok) {
		const error: API.EnhancedError = new Error('unexpected server error');
		error.status = resp.status;

		try {
			const data = await resp.json();
			const { detail = 'unexpected server error' } = data;
			error.message = detail;
		} finally {
			throw error;
		}
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

		try {
			const data = await resp.json();
			const { detail = 'unexpected server error' } = data;
			error.message = detail;
		} finally {
			throw error;
		}
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
