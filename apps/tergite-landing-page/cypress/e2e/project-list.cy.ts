import meResponses from '../fixtures/meResponses.json';
import projects from '../fixtures/projects.json';
import { API } from '../../src/types';
import utils from '../../utils';
import { testNavigation } from './navigation';

testNavigation('http://localhost:3000/projects', {
	init: () => {
		cy.intercept('GET', `${process.env.API_BASE_URL}/auth/projects`).as('initialRequest');
	},
	postInit: () => {
		cy.wait('@initialRequest');
	}
});

meResponses.forEach((resp) => {
	const isNoAuth = resp.statusCode == 403;
	const user = resp.body as API.User;
	const id = user.id ?? 'anonymous';
	const isAdmin = user.roles?.includes(API.UserRole.ADMIN);
	const isNormalUser = isAdmin === false;

	describe(`project list page for user '${id}'`, () => {
		before(() => {
			cy.readFile('./.env.test', 'utf-8').then((str) => utils.loadEnvFromString(str));
		});

		beforeEach(() => {
			if (user.id) {
				const mssConfigFile = process.env.CONFIG_FILE || 'config.toml';

				cy.task('readToml', mssConfigFile).then((mssConfig) => {
					cy.wrap(utils.generateJwt(user, mssConfig as any)).then((jwtToken) => {
						const authConfig = (mssConfig as Record<string, any>).auth || {};
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

			cy.visit('http://localhost:3000/projects');

			isAdmin && cy.get('[data-cy-data-table]').as('dataTable');
		});

		(isNoAuth || isNormalUser) &&
			it('renders Not Found for non-admins', () => {
				cy.get('[data-cy-content]').within(() => {
					cy.get('[data-cy-error]').should('contain', 'Not Found');
				});
			});

		isAdmin &&
			it('renders create button', () => {
				cy.get('[data-cy-header-btn]')
					.should('contain.text', 'Create')
					.should('have.attr', 'href', '/projects/create');
			});

		isAdmin &&
			it('renders data table', () => {
				cy.get('@dataTable').within(() => {
					cy.get('[data-cy-header-cell]').should('have.length', 2);
					cy.get('[data-cy-header-cell]').eq(0).should('contain.text', 'External ID');
					cy.get('[data-cy-header-cell]').eq(1).should('contain.text', 'Actions');

					cy.get('[data-cy-data-cell]').should('have.length', projects.length * 2);

					projects.forEach((project) => {
						cy.get(`[data-cy-data-cell=${project.id}-ext_id]`).should(
							'contain.text',
							project.ext_id
						);

						cy.get(`[data-cy-data-cell=${project.id}--action]`).within(() => {
							cy.get('[data-cy-action-btn]').should('have.length', 3);

							cy.get('[data-cy-action-btn]')
								.eq(0)
								.should('contain.text', 'View')
								.should('have.attr', 'href', `/projects/${project.id}`);

							cy.get('[data-cy-action-btn]')
								.eq(1)
								.should('contain.text', 'Edit')
								.should('have.attr', 'href', `/projects/${project.id}/edit`);

							cy.get('[data-cy-action-btn]')
								.eq(2)
								.should('contain.text', 'Delete')
								.should('have.attr', 'href', `/projects/${project.id}/del`);
						});
					});
				});
			});

		isAdmin &&
			it('Project Create button redirects to /projects/create', () => {
				cy.get('[data-cy-header-btn]').click();
				cy.url().should('eq', 'http://localhost:3000/projects/create');
			});

		isAdmin &&
			projects.forEach((project) => {
				it(`Project ${project.ext_id} 'View' buttons redirect to /projects/${project.id}`, () => {
					cy.get(`[data-cy-data-cell=${project.id}--action]`).within(() => {
						cy.get('[data-cy-action-btn="View"]').click();
						cy.url().should('eq', `http://localhost:3000/projects/${project.id}`);
					});
				});
			});

		isAdmin &&
			projects.forEach((project) => {
				it(`Project ${project.ext_id} 'Edit' buttons redirect to /projects/${project.id}/edit`, () => {
					cy.get(`[data-cy-data-cell=${project.id}--action]`).within(() => {
						cy.get('[data-cy-action-btn="Edit"]').click();
						cy.url().should('eq', `http://localhost:3000/projects/${project.id}/edit`);
					});
				});
			});

		isAdmin &&
			projects.forEach((project) => {
				it(`Project ${project.ext_id} 'Delete' buttons redirect to /projects/${project.id}/del`, () => {
					cy.get(`[data-cy-data-cell=${project.id}--action]`).within(() => {
						cy.get('[data-cy-action-btn="Delete"]').click();
						cy.url().should('eq', `http://localhost:3000/projects/${project.id}/del`);
					});
				});
			});
	});
});
