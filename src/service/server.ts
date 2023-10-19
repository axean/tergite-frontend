/**Service functions focussing on the server side */

import { cookies } from 'next/headers';
const jwtCookieKey = 'access-token';

/** Retrieves the access token from the cookies
 * @returns - the access token if available in the cookie
 */
export function getAccessToken() {
	return cookies().get(jwtCookieKey)?.value;
}

/**
 * Attempt to logout the user
 */
export function logout() {
	return cookies().delete(jwtCookieKey);
}

