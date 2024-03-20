import { SignJWT } from 'jose';

// type _User = { id: string; roles: string[] };

/**
 * Loads environment variables from a string
 */
export function loadEnvFromString(data) {
	// split string into separate lines
	const lines = data.split('\n').filter((line) => !line.startsWith('#'));

	for (const line of lines) {
		// split the key-values
		const pair = line.split('=');
		try {
			// sanitize key
			const key = pair[0].replace(/\s*$/g, '');

			if (key !== '') {
				// sanitize the value
				const value = pair[1]?.replace(/^\"|\"$|^\'|\'$|\s*$/g, '');
				// set the value on the process.env
				process.env[key] = value;
			}
		} catch (error) {
			console.error('error parsing env file', error);
		}
	}
}

/**
 * Generate a valid test JWT for the given user
 * @param {{id: string; roles: string[]}} user - the user for whom the JWT is generated
 * @param {Record<string, any>} oauthConfig - the auth config got from the auth config file
 * @returns {SignJWT} the JSON web token
 */
export async function generateJwt(user /*: _User*/, oauthConfig /*: Record<string, any>*/) {
	const payload = { sub: user.id, roles: [...user.roles] };
	const generalConfig = oauthConfig.general || {};
	const jwtSecret = generalConfig.jwt_secret || '';
	const secret = new TextEncoder().encode(jwtSecret);

	const alg = 'HS256';
	const audience = ['fastapi-users:auth'];

	return await new SignJWT(payload)
		.setProtectedHeader({ alg })
		.setIssuedAt()
		.setAudience(audience)
		.setExpirationTime('1h')
		.sign(secret);
}
