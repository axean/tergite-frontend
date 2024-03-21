import { getApiRoutes } from '../../src/utils/api';
import meResponses from '../fixtures/meResponses.json';
import { generateJwt } from '../support/utils';

meResponses.forEach((resp) => {
	const user = resp.body;
	const id = user.id ?? 'anonymous';
	const isAuthenticated = !!user.id;
	const url = 'http://localhost:3000';

	describe(`home page for user '${id}'`, () => {
		beforeEach(() => {
			const baseUrl = Cypress.env('API_BASE_URL');
			const oauthConfigFile = Cypress.env('AUTH_CONFIG_FILE');
			const landingPageUrl = Cypress.env('LANDING_ENDPOINT');
			const apiRoutes = getApiRoutes(baseUrl);

			cy.intercept('GET', `${apiRoutes.internalApi}/me`).as('me-request');
			cy.intercept('GET', `${landingPageUrl}/**`, (req) => {
				req.reply('Authenticating');
			}).as('landing-page-request');

			cy.intercept('GET', apiRoutes.devices, {
				fixture: 'devices.json'
			}).as('devices-request');

			cy.intercept('GET', apiRoutes.statuses, {
				fixture: 'statuses.json'
			}).as('all-status-data');

			cy.intercept('GET', apiRoutes.device('Luki'), {
				fixture: 'deviceLuki.json'
			}).as('device-luki-request');

			cy.intercept('GET', apiRoutes.type1('Luki'), {
				fixture: 'type1.json'
			}).as('luki-type1-request');

			if (user.id) {
				cy.task('readToml', oauthConfigFile).then((oauthConfig: Record<string, any>) => {
					cy.wrap(generateJwt(user, oauthConfig)).then((jwtToken: string) => {
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

			cy.visit(url);

			isAuthenticated && cy.wait('@me-request');
			isAuthenticated && cy.wait('@devices-request');
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
				cy.wait('@landing-page-request');
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
					cy.get('[data-cy-devices]').within(() => {
						for (let device of devices) {
							cy.get(`[data-cy-device=${device.backend_name}]`).within(() => {
								cy.get('[data-cy-device-name]').should(
									'contain',
									device.backend_name
								);
								cy.get('[data-cy-device-status]').should(
									'contain',
									device.is_online ? 'online' : 'offline'
								);
								cy.get('[data-cy-device-version]').should(
									'contain',
									device.backend_version
								);
								cy.get('[data-cy-device-n-qubits]').should(
									'contain',
									device.n_qubits
								);
								cy.get('[data-cy-device-last-update]').should(
									'contain',
									device.last_update_date.split('T')[0]
								);
							});
						}
					});
				});
			});

		isAuthenticated &&
			it('renders searched searched', () => {
				cy.get('[data-cy-devices-search]').type('Pingu');
				cy.wait(150);
				cy.get('[data-cy-device]')
					.first()
					.within(() => {
						cy.get('[data-cy-device-name]').should('contain', 'Pingu');
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
						cy.get('[data-cy-device-name]').should('contain', 'Luki');
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
				cy.url().should('include', 'Luki');
			});

		isAuthenticated &&
			it('navigates back from device page to index page', () => {
				cy.get('[data-cy-device]').first().click();
				cy.url().should('include', 'Luki');
				cy.wait('@device-luki-request');
				cy.get('[data-cy-main-navbar]').get('a').first().click();
				cy.wait('@devices-request');
				cy.url().should('equal', `${url}/`);
			});

		isAuthenticated &&
			it('logout button logs out user and redirects to landing page login screen', () => {
				cy.get('[data-cy-main-navbar] button').click();
				cy.wait('@landing-page-request');
				cy.url().should('equal', `http://localhost:3001/login?next=${url}/`);
			});
	});
});
