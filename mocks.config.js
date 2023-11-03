const { loadEnvFromFile } = require('./utils');

module.exports = async (config) => {
	loadEnvFromFile('./.env.test');

	return {
		mock: {
			collections: {
				selected: 'base'
			}
		},
		server: {
			port: 8002
		}
	};
};

