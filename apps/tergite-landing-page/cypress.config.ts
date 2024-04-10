import { defineConfig } from 'cypress';
import { readToml as readTomlUtil } from './utils';

/**
 * A cache for all TOML files read
 * @type {{ [key: string]: Record<string, any> }}
 * @constant
 */
const _TOML_FILE_CACHE = {};

export default defineConfig({
	e2e: {
		setupNodeEvents(on, config) {
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
		},
		experimentalMemoryManagement: true
	}
});

