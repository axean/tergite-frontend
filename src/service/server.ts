/**Service functions focussing on the server side */

import { cookies } from 'next/headers';

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
 * Gets the name of the cookie for auth
 * @returns the name of the cookie
 */
function getAuthCookieName() {
	return process.env.COOKIE_NAME || 'auth';
}
