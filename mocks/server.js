/**
 * A mock server to use when running tests
 *
 * I am tired of libraries that work only upto some point, then start failing.
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const { verifyJwtToken, loadEnvFromFile, readToml } = require('../utils');
const { mockDb, createCookieHeader } = require('./utils');

// Load environment before everything else
loadEnvFromFile('./.env.test');
const OAUTH_PROVIDER_URL = 'http://localhost:8002/oauth/callback';

const app = express();

app.use(cookieParser());
app.use(bodyParser.json());
app.use(
	cors({
		origin: true,
		methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'HEAD'],
		credentials: true
	})
);

app.use('/auth/projects*', (req, res, next) => {
	if (req.method === 'OPTIONS') {
		next();
	}
	const oauthConfigFile = process.env.AUTH_CONFIG_FILE || 'auth_config.toml';
	readToml(oauthConfigFile)
		.then((oauthConfig) => {
			const generalConfig = oauthConfig.general || {};
			const cookieName = generalConfig.cookie_name;
			const accessToken = req.cookies[cookieName];

			verifyJwtToken(accessToken, oauthConfig)
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
		})
		.catch((err) => {
			res.status(500);
			res.json({ detail: `${err}` });
		});
});

// updates the req.user with the currently logged in user
app.use('/auth/me/*', (req, res, next) => {
	if (req.method === 'OPTIONS') {
		next();
	}

	const oauthConfigFile = process.env.AUTH_CONFIG_FILE || 'auth_config.toml';
	readToml(oauthConfigFile)
		.then((oauthConfig) => {
			const generalConfig = oauthConfig.general || {};
			const cookieName = generalConfig.cookie_name;
			const accessToken = req.cookies[cookieName];

			verifyJwtToken(accessToken, oauthConfig)
				.then(({ payload }) => {
					req.user = { ...payload, id: payload.sub };
					next();
				})
				.catch((err) => {
					res.status(401);
					res.json({ detail: 'Unauthorized' });
				});
		})
		.catch((err) => {
			res.status(500);
			res.json({ detail: `${err}` });
		});
});

app.get('/auth/app/:provider/authorize', (req, res) => {
	const { next: nextUrl } = req.query;
	const queryStr = nextUrl ? `?next=${nextUrl}` : '';
	res.json({ authorization_url: `${OAUTH_PROVIDER_URL}${queryStr}` });
});

app.get('/oauth/callback', (req, res) => {
	const { next: nextUrl = process.env.OAUTH_REDIRECT_URI } = req.query;
	const cookieName = process.env.USER_ID_COOKIE_NAME;
	const userId = req.cookies[cookieName];
	const user = mockDb.getOneUser(userId);

	if (user) {
		createCookieHeader(user)
			.then((cookieHeader) => {
				res.set('Set-Cookie', cookieHeader);
				res.redirect(nextUrl);
			})
			.catch((error) => {
				res.status(500);
				res.json({ message: 'unexpected error' });
			});
	} else {
		res.status(401);
		res.json({ detail: 'Unauthorized' });
	}
});

app.get('/auth/projects/:id', (req, res) => {
	const { id } = req.params;
	const data = mockDb.getOneProject(id);

	if (!data) {
		res.status(404);
		res.json({ detail: 'Not Found' });
	} else {
		res.status(200);
		res.json(data);
	}
});

app.patch('/auth/projects/:id', (req, res) => {
	const { id } = req.params;

	// delay response to allow loader to be shown
	setTimeout(() => {
		try {
			const data = mockDb.updateProject(id, req.body);
			res.status(200);
			res.json(data);
		} catch (error) {
			res.status(error.status || 500);
			res.json({ detail: error.message });
		}
	}, 50);
});

app.post('/auth/projects', (req, res) => {
	// delay response to allow loader to be shown
	setTimeout(() => {
		try {
			const data = mockDb.createProject(req.body);
			res.status(201);
			res.json(data);
		} catch (error) {
			res.status(error.status || 500);
			res.json({ detail: error.message });
		}
	}, 50);
});

app.delete('/auth/projects/:id', (req, res) => {
	const { id } = req.params;
	const data = mockDb.getOneProject(id);

	if (!data) {
		res.status(404);
		res.json({ detail: 'Not Found' });
	} else {
		// delay response to allow loader to be shown
		setTimeout(() => {
			mockDb.deleteProject(id);
			res.status(204);
			res.send();
		}, 50);
	}
});

app.get('/auth/me/app-tokens/:id', (req, res) => {
	const { id } = req.params;
	const data = mockDb.getOneToken(id, req.user.id);

	if (!data) {
		res.status(404);
		res.json({ detail: 'Not Found' });
	} else {
		res.status(200);
		res.json(data);
	}
});

app.post('/auth/me/app-tokens', (req, res) => {
	// delay response to allow loader to be shown
	setTimeout(() => {
		try {
			const data = mockDb.createToken(req.user.id, req.body);
			res.status(201);
			res.json(data);
		} catch (error) {
			res.status(error.status || 500);
			res.json({ detail: error.message });
		}
	}, 50);
});

app.delete('/auth/me/app-tokens/:id', (req, res) => {
	const { id } = req.params;
	const data = mockDb.getOneToken(id, req.user.id);

	if (!data) {
		res.status(404);
		res.json({ detail: 'Not Found' });
	} else {
		// delay response to allow loader to be shown
		setTimeout(() => {
			mockDb.deleteToken(id);
			res.status(204);
			res.send();
		}, 50);
	}
});

app.get('/auth/me/app-tokens', (req, res) => {
	const { skip = 0, limit = null } = req.query;
	const data = mockDb.getAllTokens(req.user.id, skip, limit);
	res.status(200);
	res.json({ skip, limit, data });
});

// NOTE: this mutates the database. I am GET to avoid CORS issues
app.get('/refreshed-db', (req, res) => {
	mockDb.refresh();
	res.json(mockDb);
});

app.get('/auth/projects', (req, res) => {
	const { skip = 0, limit = null } = req.query;
	const data = mockDb.getAllProjects(skip, limit);
	res.status(200);
	res.json({ skip, limit, data });
});

app.get('/webgui', (req, res) => {
	res.send('Hello webgui');
});

app.get('/mss', (req, res) => {
	res.send('hello mss');
});

app.get('/', (req, res) => {
	res.json({ message: 'hello world' });
});

app.listen(8002, '0.0.0.0', () => {
	console.log('mock backend server running on port 8002');
});

