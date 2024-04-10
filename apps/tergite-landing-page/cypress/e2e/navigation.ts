import meResponses from '../fixtures/meResponses.json';
import { API } from '../../src/types';
import utils from '../../utils';

/**
 * Utility to test the navigation of any path
 * @param path the path to visit
 * @param options the options when running the function
 */
export const testNavigation = (
	path: string,
	{ init = () => {}, postInit = () => {} }: TestNavOptions = {}
) => {
	meResponses.forEach((resp) => {
		const isNoAuth = resp.statusCode == 403;
		const user = resp.body as API.User;
		const id = user.id ?? 'anonymous';
		const isAdmin = user.roles?.includes(API.UserRole.ADMIN);
		const isNormalUser = isAdmin === false;

		describe(`navigation for user '${id}' at ${path}`, () => {
			before(() => {
				cy.readFile('./.env.test', 'utf-8').then((str) => utils.loadEnvFromString(str));
			});

			beforeEach(() => {
				init();

				cy.intercept('GET', '/api/me').as('currentUserRequest');

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

				cy.visit(path);

				cy.get('[data-cy-content]').as('page');

				cy.get('[data-cy-nav-item]').as('navItems');

				cy.wait('@currentUserRequest');
				!isNoAuth && cy.get('[data-cy-nav-btn]').as('logoutBtn');

				postInit();
			});

			isNoAuth &&
				it('renders no-auth navbar', () => {
					cy.get('[data-cy-site-actions-navbar]').within(() => {
						cy.get('[data-cy-logo-img]')
							.should('have.attr', 'src')
							.and('match', /\/chalmers-logo\..*\.svg/);

						cy.get('@navItems').should('have.length', 2);

						cy.get('@navItems')
							.eq(0)
							.should('contain.text', 'Home')
							.should('have.attr', 'href', '/');

						cy.get('@navItems')
							.eq(1)
							.should('contain.text', 'Login')
							.should('have.attr', 'href', '/login');
					});
				});

			isAdmin &&
				it('renders admin navbar for admins', () => {
					cy.get('[data-cy-site-actions-navbar]').within(() => {
						cy.get('[data-cy-logo-img]')
							.should('have.attr', 'src')
							.and('match', /\/chalmers-logo\..*\.svg/);

						cy.get('@navItems').should('have.length', 3);

						cy.get('@navItems')
							.eq(0)
							.should('contain.text', 'Home')
							.should('have.attr', 'href', '/');

						cy.get('@navItems')
							.eq(1)
							.should('contain.text', 'Projects')
							.should('have.attr', 'href', '/projects');

						cy.get('@navItems')
							.eq(2)
							.should('contain.text', 'Tokens')
							.should('have.attr', 'href', '/tokens');

						cy.get('@logoutBtn').should('contain.text', 'Logout');
					});
				});

			isNormalUser &&
				it('renders non-admin navbar for non-admins', () => {
					cy.get('[data-cy-site-actions-navbar]').within(() => {
						cy.get('[data-cy-logo-img]')
							.should('have.attr', 'src')
							.and('match', /\/chalmers-logo\..*\.svg/);

						cy.get('@navItems').should('have.length', 2);

						cy.get('@navItems')
							.eq(0)
							.should('contain.text', 'Home')
							.should('have.attr', 'href', '/');

						cy.get('@navItems')
							.eq(1)
							.should('contain.text', 'Tokens')
							.should('have.attr', 'href', '/tokens');

						cy.get('@logoutBtn').should('contain.text', 'Logout');
					});
				});

			it('Home nav-item redirects to home page', () => {
				cy.get('[data-cy-site-actions-navbar]').within(() => {
					cy.get('[data-cy-nav-item="Home"]').click();
					cy.url().should('eq', 'http://localhost:3000/');
				});
			});

			isNoAuth &&
				it('Login nav-item directs to login page', () => {
					cy.get('[data-cy-site-actions-navbar]').within(() => {
						cy.get('[data-cy-nav-item="Login"]').click();
						cy.url().should('eq', 'http://localhost:3000/login');
					});
				});

			isAdmin &&
				it('Projects nav-item directs to projects page', () => {
					cy.get('[data-cy-site-actions-navbar]').within(() => {
						cy.get('[data-cy-nav-item="Projects"]').click();
						cy.url().should('eq', 'http://localhost:3000/projects');
					});
				});

			!isNoAuth &&
				it('Tokens nav-item directs to tokens page', () => {
					cy.get('[data-cy-site-actions-navbar]').within(() => {
						cy.get('[data-cy-nav-item="Tokens"]').click();
						cy.url().should('eq', 'http://localhost:3000/tokens');
					});
				});

			!isNoAuth &&
				it('Logout nav-btn logs out user', () => {
					cy.get('[data-cy-site-actions-navbar]').within(() => {
						cy.get('@logoutBtn').click();
						cy.url().should('eq', 'http://localhost:3000/');

						cy.get('@navItems').should('have.length', 2);

						cy.get('@navItems')
							.eq(0)
							.should('contain.text', 'Home')
							.should('have.attr', 'href', '/');

						cy.get('@navItems')
							.eq(1)
							.should('contain.text', 'Login')
							.should('have.attr', 'href', '/login');
					});
				});

			it('renders footer', () => {
				cy.get('[data-cy-footer]')
					.find('img')
					.should('have.attr', 'src')
					.and('match', /\/chalmers-emblem\..*\.svg/);
			});
		});
	});
};

interface TestNavOptions {
	/**
	 * Function to run at the start of every beforeEach
	 */
	init?: () => void;
	/**
	 * Function to run at the end of every beforeEach
	 */
	postInit?: () => void;
}
