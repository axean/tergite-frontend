import utils from '../../utils';
import users from '../fixtures/users.json';
import { testNavigation } from './navigation';

const providers = ['github', 'puhuri', 'chalmers'];
const nextUrls = [undefined, 'http://localhost:3000/tokens', 'http://localhost:3000/projects'];

testNavigation('http://localhost:3000/login', {
	init: () => {
		cy.intercept('GET', `/api/config`).as('initialRequest');
	},
	postInit: () => {
		cy.wait('@initialRequest');
	}
});

users.forEach((user) => {
	providers.slice(undefined, 1).forEach((provider) => {
		nextUrls.forEach((nextQueryParam) => {
			const queryStr = nextQueryParam ? `?next=${nextQueryParam}` : '';

			describe(`login page for user '${user.id}' for ?next=${nextQueryParam}`, () => {
				before(() => {
					cy.readFile('./.env.test', 'utf-8').then((str) => utils.loadEnvFromString(str));
				});

				beforeEach(() => {
					const mssConfigFile = process.env.CONFIG_FILE || 'config.toml';
					cy.task('readToml', mssConfigFile).then((mssConfig) => {
						const authConfig = (mssConfig as Record<string, any>).auth || {};
						const cookieName = process.env.USER_ID_COOKIE_NAME as string;
						const domain = authConfig.cookie_domain;

						cy.setCookie(cookieName, user.id, {
							domain,
							httpOnly: true,
							secure: false,
							sameSite: 'lax'
						});
					});
				});

				it(`renders ${provider} login link`, () => {
					cy.visit(`http://localhost:3000/login${queryStr}`);

					cy.get(`[data-cy-login-with=${provider}]`)
						.should('contain.text', `Login with ${provider}`)
						.should('have.attr', 'href', `/api/login/${provider}${queryStr}`);
				});

				it(`click ${provider} login logs one in`, () => {
					cy.visit(`http://localhost:3000/login${queryStr}`);

					const nextUrl = nextQueryParam || `${process.env.OAUTH_REDIRECT_URI}/`;
					const next = encodeURI(nextUrl);
					cy.get(`[data-cy-login-with=${provider}]`).realClick();

					cy.url().should('eq', `${next}`);
					cy.get('[data-cy-nav-btn]').should('contain.text', 'Logout');
				});

				it(`automatically redirects to next page if already logged in`, () => {
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

					cy.visit(`http://localhost:3000/login${queryStr}`);

					const nextUrl = nextQueryParam || `http://localhost:3000/login`;
					const next = encodeURI(nextUrl);

					cy.url().should('eq', `${next}`);
					cy.get('[data-cy-nav-btn]').should('contain.text', 'Logout');
				});
			});
		});
	});
});
