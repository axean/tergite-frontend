import { getApiRoutes } from '../../src/utils/api';
import meResponses from '../fixtures/meResponses.json';
import { generateJwt } from '../support/utils';

meResponses.forEach((resp) => {
	const user = resp.body;
	const id = user.id ?? 'anonymous';
	const isAuthenticated = !!user.id;
	const url = 'http://localhost:3000/Luki?type=Linegraph';

	describe(`Line chart screen for user ${id}`, () => {
		beforeEach(() => {
			const baseUrl = Cypress.env('API_BASE_URL');
			const mssConfigFile = Cypress.env('MSS_CONFIG_FILE');
			const landingPageUrl = Cypress.env('LANDING_ENDPOINT');
			const apiRoutes = getApiRoutes(baseUrl);

			cy.intercept('GET', `${apiRoutes.internalApi}/me`).as('me-request');

			cy.intercept('GET', `${landingPageUrl}/**`, (req) => {
				req.reply('Authenticating');
			}).as('landing-page-request');

			cy.intercept('GET', apiRoutes.device('Luki'), {
				fixture: 'deviceLuki.json'
			}).as('luki-device-request');

			cy.intercept('GET', `${apiRoutes.devices}/Luki/type4_domain`, {
				fixture: 'type4_domain.json'
			}).as('luki-type4-domain-request');

			cy.intercept('GET', `${apiRoutes.devices}/Luki/type4_codomain`, {
				fixture: 'type4_codomain.json'
			}).as('luki-type4-codomain-request');

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
		});

		isAuthenticated &&
			it('display domain label', () => {
				cy.wait('@luki-type4-domain-request').then(() => {
					cy.get('#domain-label').should('exist');
				});
			});

		isAuthenticated &&
			it('display domain radio buttons', () => {
				cy.wait('@luki-type4-domain-request').then(() => {
					cy.get('#domain-radio-btns').should('exist');
				});
			});

		isAuthenticated &&
			it('display domain select', () => {
				cy.wait('@luki-type4-domain-request').then(() => {
					cy.get('#domain-select').should('exist');
				});
			});

		isAuthenticated &&
			it('display codomain label', () => {
				cy.wait('@luki-type4-codomain-request').then(() => {
					cy.get('#codomain-label').should('exist');
				});
			});

		isAuthenticated &&
			it('display codomain radio buttons', () => {
				cy.wait('@luki-type4-codomain-request').then(() => {
					cy.get('#codomain-radio-btns').should('exist');
				});
			});

		isAuthenticated &&
			it('display codomain select', () => {
				cy.wait('@luki-type4-codomain-request').then(() => {
					cy.get('#codomain-select').should('exist');
				});
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
