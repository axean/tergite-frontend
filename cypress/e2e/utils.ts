import { API } from '../../src/types';
import { SignJWT } from 'jose';

/**
 * Generate a valid test JWT for the given user
 * @param user - the user for whom the JWT is generated
 */
export async function generateJwt(user: API.User): Promise<string> {
	const payload = { sud: user.id, roles: [...user.roles] };
	const jwtSecret = process.env.JWT_SECRET as string;
	const secret = new TextEncoder().encode(jwtSecret);

	const alg = process.env.JWT_ALGORITHM || 'HS256';
	const audience = [process.env.JWT_AUDIENCE as string];

	return await new SignJWT(payload)
		.setProtectedHeader({ alg })
		.setIssuedAt()
		.setAudience(audience)
		.setExpirationTime('1h')
		.sign(secret);
}

/**
 * This is a hack to load variables that would have easily been put in a .env.test file
 *
 * I am disappointed :-( writing this but I tried dotenv, nextjs.loadEnvConfig and cypress environments
 * and all just didn't seem to work together.
 * 
 * Make sure when you make a change in ".env.test", change here also.

 * @returns an object containing what woul have been in the env file
 */
export function loadEnv() {
	process.env['API_BASE_URL'] = 'http://localhost:8002';
	process.env['JWT_SECRET'] = 'b+trWSAyzq2TY5gMNXUmYIDotuvI1ghkVjDQ80jr';
	process.env['COOKIE_NAME'] = 'tergiteauth';
	process.env['OAUTH_REDIRECT_URI'] = 'http://localhost:3000';

	process.env['JWT_AUDIENCE'] = 'fastapi-users:auth';
	process.env['JWT_ALGORITHM'] = 'HS256';

	process.env['COOKIE_DOMAIN'] = 'localhost';
}

export default {
	generateJwt,
	loadEnv
};
