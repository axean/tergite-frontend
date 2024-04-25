import { getApiRoutes } from '../../src/utils/api';
import meResponses from '../fixtures/meResponses.json';
import { generateJwt } from '../support/utils';

meResponses.forEach((resp) => {
	const user = resp.body;
	const id = user.id ?? 'anonymous';
	const isAuthenticated = !!user.id;
	const url = 'http://localhost:3000/Luki';

	describe(`detail page for user ${id}`, () => {
		beforeEach(() => {
			const baseUrl = Cypress.env('API_BASE_URL');
			const mssConfigFile = Cypress.env('CONFIG_FILE');
			const landingPageUrl = Cypress.env('LANDING_ENDPOINT');
			const apiRoutes = getApiRoutes(baseUrl);

			cy.intercept('GET', `${apiRoutes.internalApi}/me`).as('me-request');

			cy.intercept('GET', `${landingPageUrl}/**`, (req) => {
				req.reply('Authenticating');
			}).as('landing-page-request');

			cy.intercept('GET', apiRoutes.device('Luki'), {
				fixture: 'deviceLuki.json'
			}).as('luki-device-request');

			cy.intercept('GET', apiRoutes.devices, {
				fixture: 'devices.json'
			}).as('devices-request');

			cy.intercept('GET', apiRoutes.statuses, {
				fixture: 'statuses.json'
			}).as('statuses-request');

			cy.intercept('GET', apiRoutes.type1('Luki'), {
				fixture: 'type1.json'
			}).as('luki-type1-request');

			if (user.id) {
				cy.task('readToml', mssConfigFile).then((mssConfig: Record<string, any>) => {
					cy.wrap(generateJwt(user, mssConfig)).then((jwtToken: string) => {
						const authConfig = mssConfig.auth || {};
						const cookieName = authConfig.cookie_name;
						const domain = authConfig.cookie_domain;

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
			isAuthenticated && cy.wait('@luki-device-request');
			isAuthenticated && cy.wait('@luki-type1-request');
		});

		isAuthenticated &&
			it('renders sidepanel', () => {
				cy.fixture('deviceLuki.json').then((device) => {
					cy.get('[data-cy-sidepanel]').within(() => {
						cy.get('[data-cy-name]').should('contain', device.backend_name);
						cy.get('[data-cy-device-status]').should(
							'contain',
							device.is_online ? 'online' : 'offline'
						);
						cy.get('[data-cy-version]').should('contain', device.backend_version);
						cy.get('[data-cy-qubits]').should('contain', device.n_qubits);
						cy.get('[data-cy-last-update]').should(
							'contain',
							device.last_update_date.split('T')[0]
						);
						cy.get('[data-cy-sample-name]').should('contain', device.sample_name);
					});
					cy.get('[data-cy-description]').should('contain', device.description);
				});
			});

		isAuthenticated &&
			it('collapses sidepanel', () => {
				cy.get('[data-cy-collapse-button]').click();
				cy.get('[data-cy-sidepanel]').should('not.exist');
				cy.get('[data-cy-expand-button]').click();
				cy.get('[data-cy-sidepanel]').should('exist');
			});

		!isAuthenticated &&
			it('renders not authenticated error message', () => {
				cy.get('[data-cy-not-authenticated]').should('contain', 'Not Authenticated');
			});

		!isAuthenticated &&
			it('redirects to landing page login screen', () => {
				cy.wait('@landing-page-request');
				cy.url().should('equal', `http://localhost:3001/login?next=${url}`);
			});
	});
});
