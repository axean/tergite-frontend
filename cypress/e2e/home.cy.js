import { getApiRoutes } from '../../src/utils/api';
import deviceList from '../fixtures/devices.json';
import meResponses from '../fixtures/meResponses.json';
import { loadEnvFromString, generateJwt } from '../support/utils';

const apiRoutes = getApiRoutes('http://0.0.0.0:8002/v2');
const defaultMLExperimentId = 'ba8290fd';

meResponses.forEach((resp) => {
	const user = resp.body;
	const id = user.id ?? 'anonymous';
	const isAuthenticated = !!user.id;

	describe(`home page for user '${id}'`, () => {
		before(() => {
			cy.readFile('./.env.test', 'utf-8').then((str) => loadEnvFromString(str));
		});

		beforeEach(() => {
			cy.intercept('GET', `${apiRoutes.internalApi}/me`).as('me-request');
			cy.intercept('GET', `${process.env.LANDING_ENDPOINT}/**`, (req) => {
				req.reply('Authenticating');
			}).as('landingPageRequest');

			cy.intercept('GET', `${apiRoutes.devices}/`, {
				fixture: 'devices.json'
			});

			cy.intercept('GET', `${apiRoutes.devices}/Loke`, (req) => {
				const device = deviceList.filter((item) => item.name === 'Loke')[0];
				req.reply(device);
			}).as('device-loki-request');

			cy.intercept('GET', `${apiRoutes.recalibration}/calibrations/?is_calibrated=False`, {
				fixture: 'uncalibrated-calibrations.json'
			}).as('uncalibrated-calibrations-request');

			cy.intercept('GET', `${apiRoutes.recalibration}/classifications/?is_calibrated=False`, {
				fixture: 'uncalibrated-classifications.json'
			});

			cy.intercept(
				'GET',
				`${apiRoutes.recalibration}/classifications/Loke?is_calibrated=false`,
				{
					fixture: 'uncalibrated-classifications.json'
				}
			);

			cy.intercept('GET', `${apiRoutes.recalibration}/classifications/?is_calibrated=False`, {
				fixture: 'uncalibrated-classifications.json'
			});

			cy.intercept('GET', `${apiRoutes.mlExperiments}/${defaultMLExperimentId}`, {
				fixture: 'default-ml-run.json'
			}).as('default-ml-experiment-request');

			if (user.id) {
				const oauthConfigFile = process.env.AUTH_CONFIG_FILE || 'auth_config.toml';
				cy.task('readToml', oauthConfigFile).then((oauthConfig) => {
					cy.wrap(generateJwt(user, oauthConfig)).then((jwtToken) => {
						const generalConfig = oauthConfig.general || {};
						const cookieName = generalConfig.cookie_name;
						const domain = generalConfig.cookie_domain;

						cy.setCookie(cookieName, jwtToken, {
							domain,
							httpOnly: true,
							secure: false,
							sameSite: 'lax'
						});
					});
				});
			}

			cy.visit('http://localhost:3000');

			isAuthenticated && cy.wait('@me-request');
			isAuthenticated && cy.wait('@uncalibrated-calibrations-request');
		});

		it('renders navbar title', () => {
			cy.get('[data-cy-main-navbar] h1').should(
				'contain',
				'WACQT | Wallenberg Centre for Quantum Technology'
			);
		});

		isAuthenticated &&
			it('renders logout button', () => {
				cy.get('[data-cy-main-navbar] button').should('contain', 'Logout');
			});

		!isAuthenticated &&
			it('renders not authenticated error message', () => {
				cy.get('[data-cy-not-authenticated]').should('contain', 'Not Authenticated');
			});

		!isAuthenticated &&
			it('redirects to landing page login screen', () => {
				cy.wait('@landingPageRequest');
				cy.url().should('equal', 'http://localhost:3001/login?next=http://localhost:3000/');
			});

		isAuthenticated &&
			it('renders systems online', () => {
				cy.get('[data-cy-online-statuses]').within(() => {
					cy.get('[data-cy-circle-text]').should('contain', '50%');
					cy.get('[data-cy-systems-online]').should('contain', '1');
				});
			});

		isAuthenticated &&
			it('renders device', () => {
				cy.fixture('devices.json').then((devices) => {
					const device = devices[0];
					cy.get('[data-cy-device]')
						.first()
						.within(() => {
							cy.get('[data-cy-device-name]').should('contain', device.name);
							cy.get('[data-cy-device-status]').should(
								'contain',
								device.is_online ? 'online' : 'offline'
							);
							cy.get('[data-cy-device-version]').should('contain', device.version);
							cy.get('[data-cy-device-n-qubits]').should(
								'contain',
								device.num_qubits
							);
							cy.get('[data-cy-device-last-update]').should(
								'contain',
								device.timelog.REGISTERED.split('T')[0]
							);
						});
				});
			});

		isAuthenticated &&
			it('renders searched searched', () => {
				cy.get('[data-cy-devices-search]').type('Pingu');
				cy.get('[data-cy-device]')
					.first()
					.within(() => {
						cy.get('[data-cy-device-name]').should('contain', 'Pingu');
					});
			});

		isAuthenticated &&
			it('renders uncalibrated calibrations', () => {
				cy.get('[data-cy-calibration]')
					.first()
					.within(() => {
						cy.get('[data-cy-calibration-name]').should('contain', 'Rabi oscillations');
					});
			});

		isAuthenticated &&
			it('renders ML experiments after refresh button', () => {
				cy.get('[data-cy-ml-experiments]').should('be.empty');

				cy.get('[data-cy-refresh-btn]').click();
				cy.wait(50);
				cy.get('[data-cy-ml-experiments] [data-cy-ml-experiment]')
					.first()
					.within(() => {
						cy.get('[data-cy-ml-experiment-id]').should(
							'contain',
							defaultMLExperimentId
						);
					});
			});

		isAuthenticated &&
			it('filters devices', () => {
				cy.get('[data-cy-filter-button]').click();
				cy.get('[data-cy-filter-online]').click();
				cy.get('[data-cy-device]')
					.first()
					.within(() => {
						cy.get('[data-cy-device-status]').should('contain', 'offline');
					});
			});

		isAuthenticated &&
			it('sorts devices by name', () => {
				cy.get('[data-cy-device]')
					.first()
					.within(() => {
						cy.get('[data-cy-device-name]').should('contain', 'Loke');
					});

				cy.get('[data-cy-sort-button]').click();
				cy.get('[data-cy-sort-order-desc]').click();
				cy.get('[data-cy-device]')
					.first()
					.within(() => {
						cy.get('[data-cy-device-name]').should('contain', 'Pingu');
					});
			});

		isAuthenticated &&
			it('sorts devices by status', () => {
				cy.get('[data-cy-sort-button]').click();
				cy.get('[data-cy-sort-status]').click();
				cy.get('[data-cy-device]')
					.first()
					.within(() => {
						cy.get('[data-cy-device-name]').should('contain', 'Pingu');
					});
			});

		isAuthenticated &&
			it('sorts devices by online date', () => {
				cy.get('[data-cy-sort-button]').click();
				cy.get('[data-cy-sort-online-date]').click();
				cy.get('[data-cy-device]')
					.first()
					.within(() => {
						cy.get('[data-cy-device-name]').should('contain', 'Pingu');
					});
			});

		isAuthenticated &&
			it('navigates to detail page on device click', () => {
				cy.get('[data-cy-device]').first().click();
				cy.url().should('include', 'Loke');
			});

		isAuthenticated &&
			it('navigates back from device page to index page', () => {
				cy.get('[data-cy-device]').first().click();
				cy.url().should('include', 'Loke');
				cy.wait('@device-loki-request');
				cy.get('[data-cy-main-navbar]').get('a').first().click();
				cy.wait('@uncalibrated-calibrations-request');
				cy.url().should('equal', 'http://localhost:3000/');
			});

		isAuthenticated &&
			it('navigates to calibration page on calibration click', () => {
				cy.get('[data-cy-calibration]').first().click();
				cy.url().should('include', 'Loke');
			});

		isAuthenticated &&
			it('navigates back from calibration page to index page', () => {
				cy.get('[data-cy-calibration]').first().click();
				cy.url().should('include', 'Loke');
				cy.get('[data-cy-main-navbar]').get('a').first().click();
				cy.wait('@uncalibrated-calibrations-request');
				cy.url().should('equal', 'http://localhost:3000/');
			});

		isAuthenticated &&
			it('navigates to ml experiment page on experiment click', () => {
				cy.get('[data-cy-refresh-btn]').click();
				cy.wait('@default-ml-experiment-request');
				cy.get('[data-cy-ml-experiment]').first().click();
				cy.url().should('include', defaultMLExperimentId);
			});

		isAuthenticated &&
			it('navigates back from ml experiment page to index page', () => {
				cy.get('[data-cy-refresh-btn]').click();
				cy.wait('@default-ml-experiment-request');
				cy.get('[data-cy-ml-experiment]').first().click();
				cy.url().should('include', defaultMLExperimentId);
				cy.get('[data-cy-main-navbar]').get('a').first().click();
				cy.wait('@uncalibrated-calibrations-request');
				cy.url().should('equal', 'http://localhost:3000/');
			});

		isAuthenticated &&
			it('logout button logs out user and redirects to landing page login screen', () => {
				cy.get('[data-cy-main-navbar] button').click();
				cy.wait('@landingPageRequest');
				cy.url().should('equal', 'http://localhost:3001/login?next=http://localhost:3000/');
			});
	});
});
