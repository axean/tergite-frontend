import { SignJWT } from 'jose';

type _User = { id: string; roles: string[] };

/**
 * Generate a valid test JWT for the given user
 * @param user - the user for whom the JWT is generated
 * @param mssConfig - the MSS config got from the mss-config file
 * @returns the JSON web token
 */
export async function generateJwt(user: _User, mssConfig: Record<string, any>) {
	const payload = { sub: user.id, roles: [...user.roles] };
	const authConfig = mssConfig.auth || {};
	const jwtSecret = authConfig.jwt_secret || '';
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

