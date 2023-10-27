const cookieParser = require('cookie-parser');
const { generateJwt, verifyJwtToken } = require('../../utils');
const users = require('../../cypress/fixtures/users.json');
const projects = require('../../cypress/fixtures/projects.json');
const deletedProjects = {};

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
	},
	{
		id: 'cookie-parser',
		url: '*',
		method: '*',
		variants: [
			{
				id: 'install',
				type: 'middleware',
				options: {
					// Express middleware to execute
					middleware: cookieParser()
				}
			}
		]
	},
	{
		id: 'cors',
		url: '/auth/*',
		method: '*',
		variants: [
			{
				id: 'add-headers',
				type: 'middleware',
				options: {
					// Express middleware to execute
					middleware: (req, res, next, core) => {
						res.set('Access-Control-Allow-Origin', req.header('Origin'));
						res.set('Access-Control-Allow-Credentials', 'true');
						res.set('Vary', 'Origin');
						next();
					}
				}
			}
		]
	},
	{
		id: 'check-superuser',
		url: '/auth/projects*',
		method: ['GET', 'POST', 'PUT', 'PATCH'],
		variants: [
			{
				id: 'validate',
				type: 'middleware',
				options: {
					// Express middleware to execute
					middleware: (req, res, next, core) => {
						const cookieName = process.env.COOKIE_NAME;
						const accessToken = req.cookies[cookieName];

						verifyJwtToken(accessToken)
							.then(({ payload }) => {
								if (!payload.roles.includes('admin')) {
									res.status(403);
									res.json({ detail: 'Forbidden' });
								} else {
									next();
								}
							})
							.catch((err) => {
								res.status(401);
								res.json({ detail: 'Unauthorized' });
							});
					}
				}
			}
		]
	},
	{
		id: 'project-list',
		url: '/auth/projects',
		method: 'GET',
		variants: [
			{
				id: 'success',
				type: 'middleware',
				options: {
					// Express middleware to execute
					middleware: (req, res, next, core) => {
						const { skip = 0, limit = null } = req.query;
						const data = projects
							.filter(({ id }) => !deletedProjects[id])
							.slice(skip, limit || undefined);
						res.status(200);
						res.json({ skip, limit, data });
					}
				}
			}
		]
	},
	{
		id: 'single-project',
		url: '/auth/projects/:id',
		method: 'GET',
		variants: [
			{
				id: 'success',
				type: 'middleware',
				options: {
					// Express middleware to execute
					middleware: (req, res, next, core) => {
						const { id } = req.params;
						const data = projects.filter(
							({ id: _id }) => id === _id && !deletedProjects[_id]
						)[0];

						if (!data) {
							res.status(404);
							res.json({ detail: 'Not Found' });
						} else {
							res.status(200);
							res.json(data);
						}
					}
				}
			}
		]
	},
	{
		id: 'delete-project',
		url: '/auth/projects/:id',
		method: 'DELETE',
		variants: [
			{
				id: 'success',
				type: 'middleware',
				options: {
					// Express middleware to execute
					middleware: (req, res, next, core) => {
						const { id } = req.params;

						const data = projects.filter(
							({ id: _id }) => id === _id && !deletedProjects[_id]
						)[0];

						if (!data) {
							res.status(404);
							res.json({ detail: 'Not Found' });
						} else {
							deletedProjects[id] = true;
							res.status(204);
							res.send();
						}
					}
				}
			}
		]
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

function respondAsSuperuser(req, res, next, core) {
	verifyJwtToken(accessToken)
		.then(({ payload }) => {
			if (!payload.roles.includes('admin')) {
				res.status(403);
				res.json({ detail: 'Forbidden' });
			} else {
				callback(req);
				const data = projects.slice(skip, limit);
				res.status(200);
				res.json({ skip, limit, data });
			}
		})
		.catch((err) => {
			res.status(401);
			res.json({ detail: 'Unauthorized' });
		});
}

