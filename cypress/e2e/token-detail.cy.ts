import meResponses from '../fixtures/meResponses.json';
import tokens from '../fixtures/tokens.json';
import { API } from '../../src/types';
import utils from '../../utils';
import { testNavigation } from './navigation';

tokens.forEach(({ id }) =>
	testNavigation(`http://localhost:3000/tokens/${id}`, {
		init: () => {
			cy.intercept('GET', `${process.env.API_BASE_URL}/auth/me/app-tokens/${id}`).as(
				'initialRequest'
			);
		},
		postInit: () => {
			cy.wait('@initialRequest');
		}
	})
);

meResponses.forEach((resp) => {
	const user = resp.body as API.User;
	const id = user.id ?? 'anonymous';
	const isAuthenticated = !!user.id;
	const myTokens = tokens.filter(({ user_id }) => id === user_id);

	myTokens.forEach((token) => {
		describe(`token '${token.title}' of project '${token.project_ext_id}' detail page for user '${id}'`, () => {
			before(() => {
				cy.readFile('./.env.test', 'utf-8').then((str) => utils.loadEnvFromString(str));
			});

			beforeEach(() => {
				cy.request(`http://localhost:8002/refreshed-db`);

				cy.intercept(
					'GET',
					`${process.env.API_BASE_URL}/auth/me/app-tokens/${token.id}`
				).as('initialRequest');

				if (user.id) {
					const oauthConfigFile = process.env.AUTH_CONFIG_FILE || 'auth_config.toml';

					cy.task('readToml', oauthConfigFile).then((oauthConfig) => {
						cy.wrap(utils.generateJwt(user, oauthConfig as any)).then((jwtToken) => {
							const generalConfig =
								(oauthConfig as Record<string, any>).general || {};
							const cookieName = generalConfig.cookie_name;
							const domain = generalConfig.cookie_domain;

							cy.setCookie(cookieName, jwtToken as string, {
								domain,
								httpOnly: true,
								secure: false,
								sameSite: 'lax'
							});
						});
					});
				}

				cy.visit(`http://localhost:3000/tokens/${token.id}`);

				isAuthenticated && cy.wait('@initialRequest');
			});

			!isAuthenticated &&
				it('renders Not Found for unauthenticated users', () => {
					cy.get('[data-cy-content]').within(() => {
						cy.get('[data-cy-error]').should('contain', 'Not Found');
					});
				});

			isAuthenticated &&
				it('renders delete button', () => {
					cy.get('[data-cy-header-btn]')
						.should('contain.text', 'Delete')
						.should('have.attr', 'href', `/tokens/${token.id}/del`);
				});

			isAuthenticated &&
				it("renders the token's name or title", () => {
					cy.get('[data-cy-project-section="Name"]').within(() => {
						cy.get('p').eq(0).should('have.text', 'Name');
						cy.get('p').eq(1).should('have.text', token.title);
					});
				});

			isAuthenticated &&
				it("renders the token's project's external ID", () => {
					cy.get('[data-cy-project-section="Project"]').within(() => {
						cy.get('p').eq(0).should('have.text', 'Project');
						cy.get('p').eq(1).should('have.text', token.project_ext_id);
					});
				});

			isAuthenticated &&
				it("renders the token's expiration", () => {
					cy.get('[data-cy-project-section="Expires"]').within(() => {
						cy.get('p').eq(0).should('have.text', 'Expires');
						cy.get('p')
							.eq(1)
							.invoke('text')
							.should('match', /(Today|Yesterday|Tomorrow) at \d?\d\:\d\d (P|A)M/);
					});
				});

			isAuthenticated &&
				it("renders the token's status", () => {
					cy.get('[data-cy-project-section="Status"]').within(() => {
						cy.get('p').eq(0).should('have.text', 'Status');
						cy.get('p')
							.eq(1)
							.should('have.text', token.lifespan_seconds > 0 ? 'live' : 'expired');
					});
				});

			isAuthenticated &&
				it(`Delete button redirects to /tokens/${token.id}/del`, () => {
					cy.get('[data-cy-header-btn]').click();
					cy.url().should('eq', `http://localhost:3000/tokens/${token.id}/del`);
				});
		});
	});
});
