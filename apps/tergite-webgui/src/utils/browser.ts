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
		error.detail = error.message;

		throw error;
	}

	return await resp.json();
}

/**
 * Poster posts data of type T via an HTTP request, return R
 *
 * @param input - the same as fetch
 * @param init - the value sent by the useSWRMutation
 * @returns the item got from the request
 */
export async function post<T, R>(input: RequestInfo | URL, { arg }: { arg?: T } = {}): Promise<R> {
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
		error.detail = error.message;

		throw error;
	}

	return await resp.json();
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
 * Transforms the value to a multiple of ten to the given power/exponent
 *
 * @param value - the value to be transformed
 * @param exponent - the power of ten by which the value is to be transformed
 * @param precision - the precision of the final result
 * @returns - the value multiplied by ten to the power of exponent
 */
export function asMultipleOfTen(value: number, exponent: number, precision: number = 3) {
	return (value * 10 ** exponent).toPrecision(precision);
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
