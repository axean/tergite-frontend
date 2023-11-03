import meResponses from '../fixtures/meResponses.json';
import projects from '../fixtures/projects.json';
import { API } from '../../src/types';
import utils from '../../utils';
import { testNavigation } from './navigation';

projects.forEach(({ id }) =>
	testNavigation(`http://localhost:3000/projects/${id}`, {
		init: () => {
			cy.intercept('GET', `${process.env.API_BASE_URL}/auth/projects/${id}`).as(
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

	projects.forEach((project) => {
		describe(`project '${project.ext_id}' detail page for user '${id}'`, () => {
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

				cy.visit(`http://localhost:3000/projects/${project.id}`);
			});

			(isNoAuth || isNormalUser) &&
				it('renders Not Found for non-admins', () => {
					cy.get('[data-cy-content]').within(() => {
						cy.get('[data-cy-error]').should('contain', 'Not Found');
					});
				});

			isAdmin &&
				it('renders edit button', () => {
					cy.get('[data-cy-header-btn]')
						.eq(0)
						.should('contain.text', 'Edit')
						.should('have.attr', 'href', `/projects/${project.id}/edit`);
				});

			isAdmin &&
				it('renders delete button', () => {
					cy.get('[data-cy-header-btn]')
						.eq(1)
						.should('contain.text', 'Delete')
						.should('have.attr', 'href', `/projects/${project.id}/del`);
				});

			isAdmin &&
				it("renders the projects' external ID", () => {
					cy.get('[data-cy-project-section="External ID"]').within(() => {
						cy.get('p').eq(0).should('have.text', 'External ID');
						cy.get('p').eq(1).should('have.text', project.ext_id);
					});
				});

			isAdmin &&
				it("renders the projects' QPU seconds", () => {
					cy.get('[data-cy-project-section="QPU Seconds"]').within(() => {
						cy.get('p').eq(0).should('have.text', 'QPU Seconds');
						cy.get('p').eq(1).should('have.text', project.qpu_seconds);
					});
				});

			isAdmin &&
				it("renders the projects' user emails", () => {
					cy.get('[data-cy-project-section="Users"]').within(() => {
						cy.get('p').eq(0).should('have.text', 'Users');

						project.user_emails.forEach((email, index) => {
							cy.get('p')
								.eq(index + 1)
								.should('have.text', email);
						});
					});
				});

			isAdmin &&
				it(`Edit button redirects to /projects/${project.id}/edit`, () => {
					cy.get('[data-cy-header-btn="Edit"]').click();
					cy.url().should('eq', `http://localhost:3000/projects/${project.id}/edit`);
				});

			isAdmin &&
				it(`Delete button redirects to /projects/${project.id}/del`, () => {
					cy.get('[data-cy-header-btn="Delete"]').click();
					cy.url().should('eq', `http://localhost:3000/projects/${project.id}/del`);
				});
		});
	});
});
