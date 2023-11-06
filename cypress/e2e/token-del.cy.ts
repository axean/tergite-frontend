import meResponses from '../fixtures/meResponses.json';
import tokens from '../fixtures/tokens.json';
import { API } from '../../src/types';
import utils from '../../utils';
import { testNavigation } from './navigation';

tokens.forEach(({ id }) =>
	testNavigation(`http://localhost:3000/tokens/${id}/del`, {
		init: () => {
			cy.intercept('GET', `${process.env.API_BASE_URL}/auth/me/app-tokens/**`).as(
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
	const wrongExtIds = ['some', 'foo', 'test', 'etc man', 'test1a'];

	myTokens.forEach((token) => {
		describe(`token '${token.title}' for project '${token.project_ext_id}' delete page for user '${id}'`, () => {
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
					cy.wrap(utils.generateJwt(user)).then((jwtToken) => {
						const cookieName = process.env.COOKIE_NAME as string;
						const domain = process.env.COOKIE_DOMAIN as string;

						cy.setCookie(cookieName, jwtToken as string, {
							domain,
							httpOnly: true,
							secure: false,
							sameSite: 'lax'
						});
					});
				}

				cy.visit(`http://localhost:3000/tokens/${token.id}/del`);

				isAuthenticated && cy.wait('@initialRequest');
			});

			!isAuthenticated &&
				it('renders Not Found for unauthenticated', () => {
					cy.get('[data-cy-content]').within(() => {
						cy.get('[data-cy-error]').should('contain', 'Not Found');
					});
				});

			isAuthenticated &&
				it('renders disabled delete button', () => {
					cy.get('[data-cy-card-btn]')
						.should('contain.text', 'Delete')
						.should('be.disabled');
				});

			isAuthenticated &&
				it('renders text input for confirmation', () => {
					cy.get('[data-cy-label]').should(
						'contain.text',
						`Confirm token's project external ID '${token.project_ext_id}'`
					);

					cy.get('[data-cy-inner-input]').should('be.visible');
				});

			isAuthenticated &&
				it('Typing the the project_ext_id in text-input enables delete button', () => {
					cy.get('[data-cy-inner-input]').clear();
					cy.get('[data-cy-inner-input]').type(token.project_ext_id);

					cy.get('[data-cy-card-btn]')
						.should('contain.text', 'Delete')
						.should('not.be.disabled');
				});

			isAuthenticated &&
				wrongExtIds.forEach((extId) => {
					it(`Typing the wrong ext ID '${extId}' in text-input disables delete button`, () => {
						cy.get('[data-cy-inner-input]').clear();
						cy.get('[data-cy-inner-input]').type(extId);
						cy.get('[data-cy-card-btn]')
							.should('contain.text', 'Delete')
							.should('be.disabled');
					});
				});

			isAuthenticated &&
				it('Delete button removes token and redirects back to project list', () => {
					cy.get('[data-cy-inner-input]').clear();
					cy.get('[data-cy-inner-input]').type(token.project_ext_id);
					cy.get('[data-cy-card-btn] [data-cy-spinner]').should('not.exist');
					cy.get('[data-cy-card-btn]').click();
					cy.get('[data-cy-card-btn]').should('be.disabled');
					cy.get('[data-cy-card-btn] [data-cy-spinner]').should('exist');

					cy.url().should('eq', `http://localhost:3000/tokens`);
					cy.get(`[data-cy-data-cell=${token.id}--action]`).should('not.exist');
					cy.get(`[data-cy-data-cell=${token.id}-name]`).should('not.exist');
					cy.get(`[data-cy-data-cell=${token.id}-project]`).should('not.exist');
					cy.get(`[data-cy-data-cell=${token.id}-expiration]`).should('not.exist');
					cy.get(`[data-cy-data-cell=${token.id}-status]`).should('not.exist');
				});
		});
	});
});
