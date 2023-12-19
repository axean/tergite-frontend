/**Service functions focussing on the server side */

import { promises } from 'fs';
import { cookies } from 'next/headers';
import path from 'path';
import { parse as parseToml, type TomlPrimitive } from 'smol-toml';

const _TOML_FILE_CACHE: { [key: string]: Record<string, TomlPrimitive> } = {};

/** Retrieves the access token from the cookies
 * @returns - the access token if available in the cookie
 */
export function getAccessToken() {
	const cookieName = getAuthCookieName();
	return cookies().get(cookieName)?.value;
}

/**
 * Attempt to logout the user
 */
export function logout() {
	const cookieName = getAuthCookieName();
	return cookies().delete(cookieName);
}

/**
 * Reads variables from .toml files
 *
 * It will return cached versions of the files unless refresh=true
 * @param {string} file - the path to the file to read
 * @param {boolean} refresh - whether the cached value should be refreshed first, default to false
 */
export async function readToml(file: string, refresh: boolean = false) {
	let cached_file = _TOML_FILE_CACHE[file];
	if (!cached_file || refresh) {
		// read file and decode it as utf-8 string
		const data = await promises.readFile(path.resolve(process.cwd(), file), 'utf-8');
		cached_file = parseToml(data);
	}

	// cache
	_TOML_FILE_CACHE[file] = cached_file;
	return cached_file;
}

/**
 * Gets the name of the cookie for auth
 * @returns the name of the cookie
 */
function getAuthCookieName() {
	return process.env.COOKIE_NAME || 'auth';
}
