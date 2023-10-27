const users = require('../cypress/fixtures/users.json');

const collections = users.map(({ id }) => ({
	id,
	routes: [
		'cookie-parser:install',
		'health-check:success',
		'api-authorize:success',
		`external-authorize:${id}`,
		'cors:add-headers',
		'check-superuser:validate',
		'project-list:success',
		'single-project:success',
		'delete-project:success'
	]
}));

const defaultCollection = { ...collections[0], id: 'base' };

module.exports = [defaultCollection, ...collections];

