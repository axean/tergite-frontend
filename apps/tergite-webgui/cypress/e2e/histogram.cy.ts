import { getApiRoutes } from '../../src/utils/api';
import meResponses from '../fixtures/meResponses.json';
import { generateJwt } from '../support/utils';

meResponses.forEach((resp) => {
	const user = resp.body;
	const id = user.id ?? 'anonymous';
	const isAuthenticated = !!user.id;
	const url = 'http://localhost:3000/Luki?type=Histogram';

	describe(`histogram device screen for user ${id}`, () => {
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

			cy.intercept('GET', `${apiRoutes.type2('Luki')}**`, {
				fixture: 'type2.json'
			}).as('luki-type2-request');

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
			it('displays radiobuttons', () => {
				cy.wait('@luki-type2-request').then(() => {
					cy.get('[data-cy-radiobutton]').should('exist');
				});
			});

		isAuthenticated &&
			it('displays datepicker', () => {
				cy.wait('@luki-type2-request').then(() => {
					cy.get('[data-cy-date-picker]').should('exist');
				});
			});

		isAuthenticated &&
			it('displays histogram t1', () => {
				cy.wait('@luki-type2-request').then(() => {
					cy.get('[data-cy-index=0]').click();
					cy.get("[data-cy-histogram='T1(us)']").should('exist');
				});
			});

		isAuthenticated &&
			it('displays histogram t2', () => {
				cy.wait('@luki-type2-request').then(() => {
					cy.get('[data-cy-index=1]').click();
					cy.get("[data-cy-histogram='T2(us)']").should('exist');
				});
			});

		isAuthenticated &&
			it('displays histogram tphi', () => {
				cy.wait('@luki-type2-request').then(() => {
					cy.get("[data-cy-index='2']").click();
					cy.get("[data-cy-histogram='TPhi(us)']").should('exist');
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
