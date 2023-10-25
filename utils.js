const { SignJWT } = require('jose');
const path = require('path');
const { readFileSync } = require('fs');

/**
 * Loads environment variables from .env.test file
 */
function loadEnvFromFile(file) {
	// read file and decode it as utf-8 string
	const data = readFileSync(path.resolve(__dirname, file), 'utf-8');
	return loadEnvFromString(data);
}

/**
 * Loads environment variables from a string
 */
function loadEnvFromString(data) {
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
 * @param {{id: string, roles: string[]}} user - the user for whom the JWT is generated
 * @returns {Promise<string>} the JSON web token
 */
async function generateJwt(user) {
	const payload = { sud: user.id, roles: [...user.roles] };
	const jwtSecret = process.env.JWT_SECRET;
	const secret = new TextEncoder().encode(jwtSecret);

	const alg = process.env.JWT_ALGORITHM || 'HS256';
	const audience = [process.env.JWT_AUDIENCE];

	return await new SignJWT(payload)
		.setProtectedHeader({ alg })
		.setIssuedAt()
		.setAudience(audience)
		.setExpirationTime('1h')
		.sign(secret);
}

module.exports = {
	loadEnvFromFile,
	loadEnvFromString,
	generateJwt
};

