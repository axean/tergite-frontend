const { generateJwt } = require('../../utils');
const users = require('../../cypress/fixtures/users.json');

const OAUTH_PROVIDER_URL = 'http://localhost:8002/oauth/callback';

module.exports = [
	{
		id: 'health-check',
		url: '/',
		method: 'GET',
		variants: [
			{
				id: 'success',
				type: 'json',
				options: {
					status: 200,
					body: { message: 'hello world' }
				}
			}
		]
	},
	{
		id: 'api-authorize',
		url: '/auth/app/*/authorize',
		method: 'GET',
		variants: [
			{
				id: 'success',
				type: 'json',
				options: {
					status: 200,
					body: { authorization_url: OAUTH_PROVIDER_URL }
				}
			}
		]
	},
	{
		id: 'external-authorize',
		url: '/oauth/callback',
		method: 'GET',
		variants: users.map((user) => ({
			id: user.id,
			type: 'middleware',
			options: {
				// Express middleware to execute
				middleware: (req, res, next, core) => {
					const nextUrl = process.env.OAUTH_REDIRECT_URI;

					createCookieHeader(user)
						.then((cookieHeader) => {
							res.set('Set-Cookie', cookieHeader);
							res.redirect(nextUrl);
						})
						.catch((error) => {
							core.logger.error(error);
							res.status(500);
							res.json({ message: 'unexpected error' });
						});
				}
			}
		}))
	}
];

/**
 * Creates a Set-Cookie header value for authentication
 *
 * @param {API.User} user - the user for JWT token generation
 * @returns {Promise<string>} the value for the Set-Cookie header
 */
async function createCookieHeader(user) {
	const cookieName = process.env.COOKIE_NAME;
	const cookieDomain = process.env.COOKIE_DOMAIN;

	const jwtToken = await generateJwt(user);
	const expiryTimestamp = new Date().getTime() + 7_200_000; // 2 hours in future
	const expiry = new Date(expiryTimestamp).toUTCString();

	return `${cookieName}=${jwtToken}; Domain=${cookieDomain}; Secure; HttpOnly; SameSite=Lax; Path=/; Expires=${expiry}`;
}

