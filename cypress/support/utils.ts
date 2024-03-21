import { SignJWT } from 'jose';

type _User = { id: string; roles: string[] };

/**
 * Generate a valid test JWT for the given user
 * @param user - the user for whom the JWT is generated
 * @param oauthConfig - the auth config got from the auth config file
 * @returns the JSON web token
 */
export async function generateJwt(user: _User, oauthConfig: Record<string, any>) {
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
