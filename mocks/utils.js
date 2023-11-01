const { generateJwt } = require('../utils');
const projects = require('../cypress/fixtures/projects.json');
const users = require('../cypress/fixtures/users.json');

class MockDb {
	projects = projects;
	users = users;
	deletedProjects = {};
	deletedUsers = {};

	constructor() {
		this.refresh = this.refresh.bind(this);
		this.deleteProject = this.deleteProject.bind(this);
		this.getAllProjects = this.getAllProjects.bind(this);
		this.getOneProject = this.getOneProject.bind(this);
		this.getOneUser = this.getOneUser.bind(this);
		this.refresh();
	}

	/**
	 * Refreshes the mock database
	 */
	refresh() {
		clearObj(this.deletedProjects);
		clearObj(this.deletedUsers);
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
		console.log({ deletedProjects: this.deletedProjects });
		return this.projects.filter(({ id: _id }) => id === _id && !this.deletedProjects[_id])[0];
	}

	/**
	 * Retrieves the user of the given id or undefined
	 * if it doesnot exist
	 *
	 * @param {string} id - the id of the user to return
	 * @returns {{id: string, roles: string[]}} - the user to return
	 */
	getOneUser(id) {
		return this.users.filter(({ id: _id }) => id === _id && !this.deletedUsers[_id])[0];
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
	const cookieName = process.env.COOKIE_NAME;
	const cookieDomain = process.env.COOKIE_DOMAIN;

	const jwtToken = await generateJwt(user);
	const expiryTimestamp = new Date().getTime() + 7_200_000; // 2 hours in future
	const expiry = new Date(expiryTimestamp).toUTCString();

	return `${cookieName}=${jwtToken}; Domain=${cookieDomain}; Secure; HttpOnly; SameSite=Lax; Path=/; Expires=${expiry}`;
}

module.exports = { mockDb: new MockDb(), createCookieHeader };

