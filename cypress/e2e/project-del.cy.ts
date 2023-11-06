import meResponses from '../fixtures/meResponses.json';
import projects from '../fixtures/projects.json';
import { API } from '../../src/types';
import utils from '../../utils';
import { testNavigation } from './navigation';

projects.forEach(({ id }) =>
	testNavigation(`http://localhost:3000/projects/${id}/del`, {
		init: () => {
			cy.intercept('GET', `${process.env.API_BASE_URL}/auth/projects/**`).as(
				'initialRequest'
			);
		},
		postInit: () => {
			cy.wait('@initialRequest');
		}
	})
);

meResponses.forEach((resp) => {
	const isNoAuth = resp.statusCode == 403;
	const user = resp.body as API.User;
	const id = user.id ?? 'anonymous';
	const isAdmin = user.roles?.includes(API.UserRole.ADMIN);
	const isNormalUser = isAdmin === false;
	const wrongExtIds = ['some', 'foo', 'test', 'etc man', 'test1a'];

	projects.forEach((project) => {
		describe(`project '${project.ext_id}' delete page for user '${id}'`, () => {
			before(() => {
				cy.readFile('./.env.test', 'utf-8').then((str) => utils.loadEnvFromString(str));
			});

			beforeEach(() => {
				cy.request(`http://localhost:8002/refreshed-db`);

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

				cy.visit(`http://localhost:3000/projects/${project.id}/del`);
			});

			(isNoAuth || isNormalUser) &&
				it('renders Not Found for non-admins', () => {
					cy.get('[data-cy-content]').within(() => {
						cy.get('[data-cy-error]').should('contain', 'Not Found');
					});
				});

			isAdmin &&
				it('renders disabled delete button', () => {
					cy.get('[data-cy-card-btn]')
						.should('contain.text', 'Delete')
						.should('be.disabled');
				});

			isAdmin &&
				it('renders text input for confirmation', () => {
					cy.get('[data-cy-label]').should(
						'contain.text',
						`Confirm project's external ID '${project.ext_id}'`
					);

					cy.get('[data-cy-inner-input]').should('be.visible');
				});

			isAdmin &&
				it('Typing the project.ext_id in text-input enables delete button', () => {
					cy.get('[data-cy-inner-input]').clear();
					cy.get('[data-cy-inner-input]').type(project.ext_id);

					cy.get('[data-cy-card-btn]')
						.should('contain.text', 'Delete')
						.should('not.be.disabled');
				});

			isAdmin &&
				wrongExtIds.forEach((extId) => {
					it(`Typing the wrong ext ID '${extId}' in text-input disables delete button`, () => {
						cy.get('[data-cy-inner-input]').clear();
						cy.get('[data-cy-inner-input]').type(extId);
						cy.get('[data-cy-card-btn]')
							.should('contain.text', 'Delete')
							.should('be.disabled');
					});
				});

			isAdmin &&
				it('Delete button removes project and redirects back to project list', () => {
					cy.get('[data-cy-inner-input]').clear();
					cy.get('[data-cy-inner-input]').type(project.ext_id);
					cy.get('[data-cy-card-btn] [data-cy-spinner]').should('not.exist');
					cy.get('[data-cy-card-btn]').click();
					cy.get('[data-cy-card-btn]').should('be.disabled');
					cy.get('[data-cy-card-btn] [data-cy-spinner]').should('exist');

					cy.url().should('eq', `http://localhost:3000/projects`);
					cy.get(`[data-cy-data-cell=${project.id}--action]`).should('not.exist');
					cy.get(`[data-cy-data-cell=${project.id}-ext_id]`).should('not.exist');
				});
		});
	});
});
