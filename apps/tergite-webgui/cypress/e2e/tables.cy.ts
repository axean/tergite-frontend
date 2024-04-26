import { getApiRoutes } from '../../src/utils/api';
import meResponses from '../fixtures/meResponses.json';
import { generateJwt } from '../support/utils';

meResponses.forEach((resp) => {
	const user = resp.body;
	const id = user.id ?? 'anonymous';
	const isAuthenticated = !!user.id;
	const url = 'http://localhost:3000/Luki?type=Tableview';

	describe(`table page for user ${id}`, () => {
		beforeEach(() => {
			const baseUrl = Cypress.env('API_BASE_URL');
			const mssConfigFile = Cypress.env('MSS_CONFIG_FILE');
			const landingPageUrl = Cypress.env('LANDING_ENDPOINT');
			const apiRoutes = getApiRoutes(baseUrl);

			cy.intercept('GET', `${apiRoutes.internalApi}/me`).as('me-request');

			cy.intercept('GET', `${landingPageUrl}/**`, (req) => {
				req.reply('Authenticating');
			}).as('landing-page-request');

			cy.intercept('GET', `${apiRoutes.devices}/Luki/data`, {
				fixture: 'lukiAllData.json'
			}).as('luki-all-data-request');

			cy.intercept('GET', apiRoutes.device('Luki'), {
				fixture: 'deviceLuki.json'
			}).as('luki-device-request');

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
			isAuthenticated && cy.wait('@luki-all-data-request');
		});

		isAuthenticated &&
			it('load tables', () => {
				cy.get('[data-cy-qubit-table]').should('exist');
			});

		isAuthenticated &&
			it('Load qubit table', () => {
				cy.get('[data-index=0]').click();
				cy.wait(200);
				cy.get('[data-cy-qubit-table]').should('exist');
			});

		isAuthenticated &&
			it('Load gate table', () => {
				cy.get('[data-index=1]').click();
				cy.wait(200);
				cy.get('[data-cy-gate-table]').should('exist');
			});

		isAuthenticated &&
			it('Load coupler table', () => {
				cy.get('[data-index=2]').click();
				cy.wait(200);
				cy.get('[data-cy-coupler-table]').should('exist');
			});

		isAuthenticated &&
			it('Load res table', () => {
				cy.get('[data-index=3]').click();
				cy.wait(200);
				cy.get('[data-cy-res-table]').should('exist');
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
