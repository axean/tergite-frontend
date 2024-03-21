import { defineConfig } from 'cypress';
import { readToml as readTomlUtil } from './src/utils/server';

export default defineConfig({
	e2e: {
		setupNodeEvents(on, config) {
			require('dotenv').config({ path: '.env.test' });

			// `on` is used to hook into various events Cypress emits
			// `config` is the resolved Cypress config
			config.env['apiBaseUrl'] = process.env.NEXT_PUBLIC_API_BASE_URL;
			config.env = { ...config.env, ...process.env };

			// implement node event listeners here
			on('task', {
				/**
				 * Reads variables from .toml files
				 *
				 * It will return cached versions of the files unless refresh=true
				 * @param file - the path to the file to read
				 * @param refresh - whether the cached value should be refreshed first, default to false
				 * @returns - the object read from the TOML file
				 */
				readToml(file: string, refresh: boolean = false) {
					return readTomlUtil(file, refresh);
				}
			});

			return config;
		},
		baseUrl: 'http://localhost:3000'
	}
});

