/**Service functions focussing on the server side */

import { promises } from 'fs';
import { jwtVerify } from 'jose';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import parseToml from '@iarna/toml/parse-async';

/**
 * A cache for all TOML files read
 * @constant
 */
const _TOML_FILE_CACHE: { [key: string]: Record<string, any> } = {};

/** Retrieves the access token from the cookies
 * @param cookieName - the name of the cookie that holds the auth details
 * @returns - the access token if available in the cookie
 */
export function getAccessToken(req: NextApiRequest, cookieName: string) {
	return req.cookies[cookieName];
}

/**
 * Attempt to logout the user
 * @param cookieName - the name of the cookie that holds the auth details
 */
export function logout(req: NextApiRequest, res: NextApiResponse, cookieName: string) {
	const expiredCookieHeader = createCookieHeader(req, '', -3600, cookieName);
	res.setHeader('Set-Cookie', expiredCookieHeader);
}

/**
 * Verified a given JWT token
 * @param token - the token to be verified
 * @param oauthConfig - the auth config got from the auth config file
 * @returns - the verifiration result including the claims stored  in the payload
 */
export async function verifyJwtToken(token: string, oauthConfig: Record<string, any>) {
	const generalConfig = oauthConfig.general || {};
	const jwtSecret = generalConfig.jwt_secret || '';
	const audience = 'fastapi-users:auth';
	const algorithms = ['HS256'];
	const secret = new TextEncoder().encode(jwtSecret);

	return await jwtVerify(token, secret, { audience, algorithms });
}

/**
 * Creates a Set-Cookie header value for authentication
 *
 * @param req - the request object
 * @param token - the JWT token to store in the cookie
 * @param ttl - the time-to-livefor the cookie in milliseconds . Negative time means it is expired already.
 * @param cookieName - the name of the cookie that holds the auth details
 * @returns - the value for the Set-Cookie header
 */
function createCookieHeader(req: NextApiRequest, token: string, ttl: number, cookieName: string) {
	// get rid of any ports if exists
	const cookieDomain = req.headers['host']?.replace(/\:\d+$/, '');

	const expiryTimestamp = new Date().getTime() + ttl;
	const expiry = new Date(expiryTimestamp).toUTCString();

	return `${cookieName}=${token}; Domain=${cookieDomain}; Secure; HttpOnly; SameSite=Lax; Path=/; Expires=${expiry}`;
}

/**
 * Reads variables from .toml files
 *
 * It will return cached versions of the files unless refresh=true
 * @param file - the path to the file to read
 * @param refresh - whether the cached value should be refreshed first, default to false
 * @returns - the object read from the TOML file
 */
export async function readToml(file: string, refresh: boolean = false) {
	let cachedFile = _TOML_FILE_CACHE[file];
	if (!cachedFile || refresh) {
		// read file and decode it as utf-8 string
		const data = await promises.readFile(path.resolve(process.cwd(), file), 'utf-8');
		cachedFile = await parseToml(data);
		// cache
		_TOML_FILE_CACHE[file] = cachedFile;
	}

	return cachedFile;
}
