const users = require('../cypress/fixtures/users.json');

const collections = users.map(({ id }) => ({
	id,
	routes: ['health-check:success', 'api-authorize:success', `external-authorize:${id}`]
}));

const defaultCollection = { ...collections[0], id: 'base' };

module.exports = [defaultCollection, ...collections];

