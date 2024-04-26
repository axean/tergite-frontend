const { SignJWT, jwtVerify, JWTVerifyResult } = require('jose');
const path = require('path');
const { readFileSync, promises } = require('fs');
const parseToml = require('@iarna/toml/parse-async');

/**
 * A cache for all TOML files read
 * @type {{ [key: string]: Record<string, any> }}
 * @constant
 */
const _TOML_FILE_CACHE = {};

/**
 * Loads environment variables from .env files
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
 * @param {Record<string,any>} mssConfig - the config got from the MSS config file
 * @returns {Promise<string>} the JSON web token
 */
async function generateJwt(user, mssConfig) {
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

/**
 * Verified a given JWT token
 * @param {string} token - the token to be verified
 * @param {Record<string,any>} mssConfig - the MSS config got from the mss-config file
 * @returns  {Promise<JWTVerifyResult>} - the verifiration result including the claims stored  in the payload
 */
async function verifyJwtToken(token, mssConfig) {
	const authConfig = mssConfig.auth || {};
	const jwtSecret = authConfig.jwt_secret || '';
	const audience = 'fastapi-users:auth';
	const algorithms = ['HS256'];
	const secret = new TextEncoder().encode(jwtSecret);

	return await jwtVerify(token, secret, { audience, algorithms });
}

/**
 * A random integer capped to the given max value
 *
 * @param {number} max - the maximum possible random number
 * @returns {number} - a random integer
 */
function randInt(max) {
	return Math.floor(Math.random() * max);
}

/**
 * Reads variables from .toml files
 *
 * It will return cached versions of the files unless refresh=true
 * @param {string} file - the path to the file to read
 * @param {boolean} refresh - whether the cached value should be refreshed first, default to false
 * @returns {Promise<{[key: string]: any}>} - the object read from the TOML file
 */
async function readToml(file, refresh = false) {
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

module.exports = {
	loadEnvFromFile,
	loadEnvFromString,
	generateJwt,
	verifyJwtToken,
	randInt,
	readToml
};

