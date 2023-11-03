import utils from '../../utils';
import users from '../fixtures/users.json';

const providers = ['github', 'puhuri', 'chalmers'];

users.forEach((user) => {
	describe(`login page for user '${user.id}'`, () => {
		before(() => {
			cy.readFile('./.env.test', 'utf-8').then((str) => utils.loadEnvFromString(str));
		});

		providers.forEach((provider) => {
			beforeEach(() => {
				if (user.id) {
					const cookieName = process.env.USER_ID_COOKIE_NAME as string;
					const domain = process.env.COOKIE_DOMAIN as string;

					cy.setCookie(cookieName, user.id, {
						domain,
						httpOnly: true,
						secure: false,
						sameSite: 'lax'
					});
				}
				cy.visit('http://localhost:3000/login');
			});

			it(`renders ${provider} login link`, () => {
				cy.get(`[data-cy-login-with=${provider}]`)
					.should('contain.text', `Login with ${provider}`)
					.should('have.attr', 'href', `/api/login/${provider}`);
			});

			it(`click ${provider} login logs one in`, () => {
				const next = encodeURI(process.env.OAUTH_REDIRECT_URI as string);
				cy.get(`[data-cy-login-with=${provider}]`).click();

				cy.url().should('eq', `${next}/`);
				cy.get('[data-cy-nav-btn]').should('contain.text', 'Logout');
			});
		});
	});
});
