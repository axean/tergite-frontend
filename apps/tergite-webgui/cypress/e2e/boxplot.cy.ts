import { getApiRoutes } from '../../src/utils/api';
import meResponses from '../fixtures/meResponses.json';
import { generateJwt } from '../support/utils';

meResponses.forEach((resp) => {
	const user = resp.body;
	const id = user.id ?? 'anonymous';
	const isAuthenticated = !!user.id;
	const url = 'http://localhost:3000/Luki?type=Boxplot';

	describe(`boxplot screen for ${id}`, () => {
		beforeEach(() => {
			const baseUrl = Cypress.env('API_BASE_URL');
			const oauthConfigFile = Cypress.env('AUTH_CONFIG_FILE');
			const landingPageUrl = Cypress.env('LANDING_ENDPOINT');
			const apiRoutes = getApiRoutes(baseUrl);

			cy.intercept('GET', `${apiRoutes.internalApi}/me`).as('me-request');

			cy.intercept('GET', `${landingPageUrl}/**`, (req) => {
				req.reply('Authenticating');
			}).as('landing-page-request');

			cy.intercept('GET', apiRoutes.device('Luki'), {
				fixture: 'deviceLuki.json'
			}).as('luki-device-request');

			cy.intercept('GET', `${apiRoutes.type3('Luki')}**`, {
				fixture: 'type3.json'
			}).as('luki-type3-request');

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
			isAuthenticated && cy.wait('@luki-device-request');
		});

		isAuthenticated &&
			it('displays datepicker', () => {
				cy.get('[data-cy-date-picker]').should('exist');
			});

		isAuthenticated &&
			it('displays box plot', () => {
				cy.get('[data-cy-box-plot]').should('exist');
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
