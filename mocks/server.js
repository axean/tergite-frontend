/**
 * A mock server to use when running tests
 *
 * I am tired of libraries that work only upto some point, then start failing.
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { verifyJwtToken, loadEnvFromFile } = require('../utils');
const { mockDb, createCookieHeader } = require('./utils');
// const audit = require('express-requests-logger');

// Load environment before everything else
loadEnvFromFile('./.env.test');
const OAUTH_PROVIDER_URL = 'http://localhost:8002/oauth/callback';

const app = express();

app.use(cookieParser());
// app.use(audit());
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
});

app.get('/auth/app/:provider/authorize', (req, res) => {
	res.json({ authorization_url: OAUTH_PROVIDER_URL });
});

app.get('/oauth/callback', (req, res) => {
	const nextUrl = process.env.OAUTH_REDIRECT_URI;
	const cookieName = process.env.USER_ID_COOKIE_NAME;
	const userId = req.cookies[cookieName];
	const user = mockDb.getOneUser(userId);

	createCookieHeader(user)
		.then((cookieHeader) => {
			res.set('Set-Cookie', cookieHeader);
			res.redirect(nextUrl);
		})
		.catch((error) => {
			res.status(500);
			res.json({ message: 'unexpected error' });
		});
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

app.get('/', (req, res) => {
	res.json({ message: 'hello world' });
});

app.listen(8002, '0.0.0.0', () => {
	console.log('mock backend server running on port 8002');
});

