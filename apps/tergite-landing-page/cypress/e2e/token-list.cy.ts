import meResponses from '../fixtures/meResponses.json';
import tokens from '../fixtures/tokens.json';
import { API } from '../../src/types';
import utils from '../../utils';
import { testNavigation } from './navigation';

testNavigation('http://localhost:3000/tokens', {
	init: () => {
		cy.intercept('GET', `${process.env.API_BASE_URL}/auth/me/app-tokens`).as('initialRequest');
	},
	postInit: () => {
		cy.wait('@initialRequest');
	}
});

meResponses.forEach((resp) => {
	const user = resp.body as API.User;
	const id = user.id ?? 'anonymous';
	const isAuthenticated = !!user.id;
	const myTokens = tokens.filter(({ user_id }) => id === user_id);

	describe(`token list page for user '${id}'`, () => {
		before(() => {
			cy.readFile('./.env.test', 'utf-8').then((str) => utils.loadEnvFromString(str));
		});

		beforeEach(() => {
			if (user.id) {
				const mssConfigFile = process.env.CONFIG_FILE || 'config.toml';

				cy.task('readToml', mssConfigFile).then((mssConfig) => {
					cy.wrap(utils.generateJwt(user, mssConfig as any)).then((jwtToken) => {
						const authConfig = (mssConfig as Record<string, any>).auth || {};
						const cookieName = authConfig.cookie_name;
						const domain = authConfig.cookie_domain;

						cy.setCookie(cookieName, jwtToken as string, {
							domain,
							httpOnly: true,
							secure: false,
							sameSite: 'lax'
						});
					});
				});
			}

			cy.visit('http://localhost:3000/tokens');

			isAuthenticated && cy.get('[data-cy-data-table]').as('dataTable');
		});

		!isAuthenticated &&
			it('renders Not Found the unauthenticated', () => {
				cy.get('[data-cy-content]').within(() => {
					cy.get('[data-cy-error]').should('contain', 'Not Found');
				});
			});

		isAuthenticated &&
			it("renders 'generate' button", () => {
				cy.get('[data-cy-header-btn]')
					.should('contain.text', 'Generate')
					.should('have.attr', 'href', '/tokens/create');
			});

		isAuthenticated &&
			it('renders data table', () => {
				cy.get('@dataTable').within(() => {
					cy.get('[data-cy-header-cell]').should('have.length', 5);
					cy.get('[data-cy-header-cell]').eq(0).should('contain.text', 'Name');
					cy.get('[data-cy-header-cell]').eq(1).should('contain.text', 'Project');
					cy.get('[data-cy-header-cell]').eq(2).should('contain.text', 'Expires');
					cy.get('[data-cy-header-cell]').eq(3).should('contain.text', 'Status');
					cy.get('[data-cy-header-cell]').eq(4).should('contain.text', 'Actions');

					cy.get('[data-cy-data-cell]').should('have.length', myTokens.length * 5);

					myTokens.forEach((token) => {
						cy.get(`[data-cy-data-cell=${token.id}-name]`).should(
							'contain.text',
							token.title
						);
						cy.get(`[data-cy-data-cell=${token.id}-project]`).should(
							'contain.text',
							token.project_ext_id
						);
						cy.get(`[data-cy-data-cell=${token.id}-expiration]`)
							.invoke('text')
							.should('match', /(Today|Yesterday|Tomorrow) at \d?\d\:\d\d (P|A)M/);
						cy.get(`[data-cy-data-cell=${token.id}-status]`).should(
							'contain.text',
							token.lifespan_seconds > 0 ? 'live' : 'expired'
						);

						cy.get(`[data-cy-data-cell=${token.id}--action]`).within(() => {
							cy.get('[data-cy-action-btn]').should('have.length', 2);

							cy.get('[data-cy-action-btn]')
								.eq(0)
								.should('contain.text', 'View')
								.should('have.attr', 'href', `/tokens/${token.id}`);

							cy.get('[data-cy-action-btn]')
								.eq(1)
								.should('contain.text', 'Delete')
								.should('have.attr', 'href', `/tokens/${token.id}/del`);
						});
					});
				});
			});

		isAuthenticated &&
			it('Token Generation button redirects to /tokens/create', () => {
				cy.get('[data-cy-header-btn]').click();
				cy.url().should('eq', 'http://localhost:3000/tokens/create');
			});

		isAuthenticated &&
			myTokens.forEach((token) => {
				it(`'View' button of token ${token.title} of ${token.project_ext_id} redirects to /tokens/${token.id}`, () => {
					cy.get(
						`[data-cy-data-cell=${token.id}--action] [data-cy-action-btn="View"]`
					).click();
					cy.url().should('eq', `http://localhost:3000/tokens/${token.id}`);
				});
			});

		isAuthenticated &&
			myTokens.forEach((token) => {
				it(`'Delete' button of token ${token.title} of ${token.project_ext_id} redirects to /projects/${token.id}/del`, () => {
					cy.get(
						`[data-cy-data-cell=${token.id}--action] [data-cy-action-btn="Delete"]`
					).click();
					cy.url().should('eq', `http://localhost:3000/tokens/${token.id}/del`);
				});
			});
	});
});
