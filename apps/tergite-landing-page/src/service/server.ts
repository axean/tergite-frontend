/**Service functions focussing on the server side */

import { cookies } from 'next/headers';

/** Retrieves the access token from the cookies
 * @param cookieName - the name of the cookie that holds the auth details
 * @returns - the access token if available in the cookie
 */
export function getAccessToken(cookieName: string) {
	return cookies().get(cookieName)?.value;
}

/**
 * Attempt to logout the user
 * @param cookieName - the name of the cookie that holds the auth details
 */
export function logout(cookieName: string) {
	return cookies().delete(cookieName);
}
