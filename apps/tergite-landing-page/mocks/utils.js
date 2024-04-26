const { generateJwt, randInt, readToml } = require('../utils');
const projects = require('../cypress/fixtures/projects.json');
const users = require('../cypress/fixtures/users.json');
const tokens = require('../cypress/fixtures/tokens.json');
const { randomUUID } = require('crypto');

class MockDb {
	projects = [...projects];
	users = [...users];
	tokens = [...tokens];
	deletedProjects = {};
	deletedUsers = {};
	deletedTokens = {};

	constructor() {
		this.refresh = this.refresh.bind(this);
		this.deleteProject = this.deleteProject.bind(this);
		this.getAllProjects = this.getAllProjects.bind(this);
		this.getOneProject = this.getOneProject.bind(this);
		this.getOneUser = this.getOneUser.bind(this);
		this.updateProject = this.updateProject.bind(this);
		this.createProject = this.createProject.bind(this);
		this.getByExtId = this.getProjectByExtId.bind(this);
		this.refresh();
	}

	/**
	 * Refreshes the mock database
	 */
	refresh() {
		clearObj(this.deletedProjects);
		clearObj(this.deletedUsers);
		clearObj(this.deletedTokens);
		this.projects = [...projects];
		this.users = [...users];
		this.tokens = [...tokens];
	}

	/**
	 * Delete a given project
	 * @param {string} id - the id of the project to delete
	 */
	deleteProject(id) {
		this.deletedProjects[id] = true;
	}

	/**
	 * Gets all the projects, skippijng `skip` upto the given `limit`
	 *
	 * @param {number} skip - the number of matched items to skip
	 * @param {number | null} limit - the maximum number of items to return
	 * @returns {{id: string, ext_id: string, user_emails?: string[], qpu_seconds: number}[]} - the list of all undeleted projects
	 */
	getAllProjects(skip, limit) {
		return this.projects
			.filter(({ id }) => !this.deletedProjects[id])
			.slice(skip, limit || undefined);
	}

	/**
	 * Retrieves the project of the given id or undefined
	 * if it doesnot exist
	 *
	 * @param {string} id - the id of the project to return
	 * @returns {{id: string, ext_id: string, user_emails?: string[], qpu_seconds: number}} - the project to return
	 */
	getOneProject(id) {
		return this.projects.filter(({ id: _id }) => id === _id && !this.deletedProjects[_id])[0];
	}

	/**
	 * Retrieves the project of the given external ID or undefined
	 * if it doesnot exist
	 *
	 * @param {string} extId - the extId of the project to return
	 * @returns {{id: string, ext_id: string, user_emails?: string[], qpu_seconds: number}} - the project to return
	 */
	getProjectByExtId(extId) {
		return this.getAllProjects().filter(({ ext_id }) => extId === ext_id)[0];
	}

	/**
	 * Retrieves the project of the given external ID and with the given user id in it or returns undefined
	 * if it doesnot exist
	 *
	 * @param {string} extId - the extId of the project to return
	 * @param {string} userId - the userId that should be attached to that project
	 * @returns {{id: string, ext_id: string, user_emails?: string[], qpu_seconds: number}} - the project to return
	 */
	getProjectByExtIdAndUserId(extId, userId) {
		const user = this.getOneUser(userId);
		if (user) {
			return this.getAllProjects().filter(
				({ ext_id, user_emails }) => extId === ext_id && user_emails.includes(user.email)
			)[0];
		}

		return undefined;
	}

	/**
	 * Creates the project, returning it on completion. It fails if a project the same ext_id already exists
	 *
	 * @param {{ext_id: string, user_emails: string[], qpu_seconds: number}} payload - the project to create
	 * @returns {{id: string, ext_id: string, user_emails?: string[], qpu_seconds: number}} - the created project
	 */
	createProject(payload) {
		const preExistingProject = this.getProjectByExtId(payload.ext_id);
		if (preExistingProject) {
			const error = new Error('PROJECT_ALREADY_EXISTS');
			error.status = 400;
			throw error;
		}

		const newProject = { ...payload, id: `${randInt(10000000)}` };
		this.projects.push(newProject);
		return newProject;
	}

	/**
	 * Updates the project, returning it on completion. It fails if a project does not exist
	 * @param {string} id - the id of the project
	 * @param {{ user_emails?: string[], qpu_seconds?: number}} payload - the updates to add
	 * @returns {{id: string, ext_id: string, user_emails?: string[], qpu_seconds: number}} - the updated project
	 */
	updateProject(id, payload) {
		const preExistingProject = this.getOneProject(id);
		if (!preExistingProject) {
			const error = new Error('Not Found');
			error.status = 404;
			throw error;
		}

		const newProject = { ...preExistingProject, ...payload };
		this.projects = this.projects.map((item) => (item.id === id ? newProject : item));
		return newProject;
	}

	/**
	 * Retrieves the user of the given id or undefined
	 * if it doesnot exist
	 *
	 * @param {string} id - the id of the user to return
	 * @returns {{id: string, roles: string[], email: string}} - the user to return
	 */
	getOneUser(id) {
		return this.users.filter(({ id: _id }) => id === _id && !this.deletedUsers[_id])[0];
	}

	/**
	 * Delete a given token
	 * @param {string} id - the id of the token to delete
	 */
	deleteToken(id) {
		this.deletedTokens[id] = true;
	}

	/**
	 * Gets all the tokens for the given userId, skipping `skip` upto the given `limit`
	 *
	 * @param {string} userId - the id of the user of the tokens
	 * @param {number} skip - the number of matched items to skip
	 * @param {number | null} limit - the maximum number of items to return
	 * @returns {{id: string; title: string; token?: string; project_ext_id: string; lifespan_seconds: number;created_at: string;}[]} - the list of all undeleted tokens
	 */
	getAllTokens(userId, skip, limit) {
		return this.tokens
			.filter(({ id, user_id }) => user_id === userId && !this.deletedTokens[id])
			.slice(skip, limit || undefined);
	}

	/**
	 * Retrieves the token of the given id and given user id or undefined
	 * if it doesnot exist or it does not belong to the given userId
	 *
	 * @param {string} id - the id of the token to return
	 * @param {string} userId - the id of the user of the token
	 * @returns {{id: string; title: string; token?: string; project_ext_id: string; lifespan_seconds: number; created_at: string;}} - the token to return
	 */
	getOneToken(id, userId) {
		return this.tokens.filter(
			({ id: _id, user_id }) => id === _id && user_id === userId && !this.deletedTokens[_id]
		)[0];
	}

	/**
	 * Creates the token for given userId, returning it on completion. It fails if the user is not attached to the project of project_ext_id
	 *
	 * @param {string} userId - the id of the user for the token
	 * @param {{title: string; project_ext_id: string; lifespan_seconds: number;}} payload - the token to create
	 * @returns {{access_token: string; token_type: string}} - the created token
	 */
	createToken(userId, payload) {
		const project = this.getProjectByExtIdAndUserId(userId, payload.project_ext_id);
		if (project) {
			const error = new Error('Forbidden');
			error.status = 403;
			throw error;
		}

		const newToken = {
			...payload,
			id: `${randInt(10000000)}`,
			token: `${randomUUID()}`,
			created_at: new Date().toISOString()
		};
		this.tokens.push(newToken);
		return { access_token: newToken.token, token_type: 'bearer' };
	}
}

/**
 * Clears a given object
 * @param {{[key: string]: any}} obj - the object to clear
 */
function clearObj(obj) {
	for (var member in obj) delete obj[member];
}

/**
 * Creates a Set-Cookie header value for authentication
 *
 * @param {API.User} user - the user for JWT token generation
 * @returns {Promise<string>} the value for the Set-Cookie header
 */
async function createCookieHeader(user) {
	const mssConfigFile = process.env.MSS_CONFIG_FILE || 'mss-config.toml';
	const mssConfig = await readToml(mssConfigFile);
	const authConfig = mssConfig.auth || {};

	const cookieName = authConfig.cookie_name;
	const cookieDomain = authConfig.cookie_domain;

	const jwtToken = await generateJwt(user, mssConfig);
	const expiryTimestamp = new Date().getTime() + 7_200_000; // 2 hours in future
	const expiry = new Date(expiryTimestamp).toUTCString();

	return `${cookieName}=${jwtToken}; Domain=${cookieDomain}; Secure; HttpOnly; SameSite=Lax; Path=/; Expires=${expiry}`;
}

module.exports = { mockDb: new MockDb(), createCookieHeader };

