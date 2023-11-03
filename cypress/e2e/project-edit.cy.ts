import meResponses from '../fixtures/meResponses.json';
import projectPayloads from '../fixtures/project-create.json';
import projects from '../fixtures/projects.json';
import { API } from '../../src/types';
import utils, { randInt } from '../../utils';
import { testNavigation } from './navigation';

projects.forEach(({ id }) =>
	testNavigation(`http://localhost:3000/projects/${id}/edit`, {
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
	const dummyEmails = ['j@ex.com', 'h@d.com', 'me@s.com', 'p@g.com'];
	const payload = projectPayloads[randInt(projectPayloads.length - 1)];

	projects.forEach((project) => {
		describe(`project '${project.ext_id}' editing page for user '${id}'`, () => {
			before(() => {
				cy.readFile('./.env.test', 'utf-8').then((str) => utils.loadEnvFromString(str));
			});

			beforeEach(() => {
				cy.request(`http://localhost:8002/refreshed-db`);
				cy.intercept('GET', `${process.env.API_BASE_URL}/auth/projects/${project.id}`).as(
					'initialRequest'
				);
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

				cy.visit(`http://localhost:3000/projects/${project.id}/edit`);
				cy.wait('@initialRequest');
			});

			(isNoAuth || isNormalUser) &&
				it('renders Not Found for non-admins', () => {
					cy.get('[data-cy-content]').within(() => {
						cy.get('[data-cy-error]').should('contain', 'Not Found');
					});
				});

			isAdmin &&
				it('renders save button', () => {
					cy.get('[data-cy-header-btn]').should('contain.text', 'Save');
				});

			isAdmin &&
				it('renders filled and disabled text input for external ID', () => {
					cy.get('[data-cy-input="External ID"]').within(() => {
						cy.get('[data-cy-label]').should('contain.text', 'External ID');

						cy.get('[data-cy-inner-input]')
							.should('have.attr', 'type', 'text')
							.should('be.disabled')
							.should('have.attr', 'value', project.ext_id);
					});
				});

			isAdmin &&
				it('renders filled number input for QPU Seconds', () => {
					cy.get('[data-cy-input="QPU Seconds"]').within(() => {
						cy.get('[data-cy-label]').should('contain.text', 'QPU Seconds');

						cy.get('[data-cy-inner-input]')
							.should('have.attr', 'type', 'number')
							.should('have.attr', 'required', 'required')
							.should('have.attr', 'value', `${project.qpu_seconds}`);
					});
				});

			isAdmin &&
				it('renders filled multi-input for User Emails', () => {
					cy.get('[data-cy-multi-input="User Emails"]').within(() => {
						cy.get('[data-cy-label]').should('contain.text', 'User Emails');
						cy.get('[data-cy-multi-input-add-btn]').should('contain.text', '+');

						cy.get('[data-cy-input-wrapper]').should(
							'have.length',
							project.user_emails.length
						);

						project.user_emails.forEach((email, index) => {
							cy.get(`[data-cy-inner-input=${index}]`)
								.should('have.attr', 'value', email)
								.should('have.attr', 'required', 'required');
						});
					});
				});

			isAdmin &&
				it('Updating the form and saving edits the project', () => {
					cy.get('[data-cy-multi-input="User Emails"] [data-cy-multi-input-add-btn]').as(
						'emailAddBtn'
					);
					cy.get('[data-cy-input="QPU Seconds"] [data-cy-inner-input]').as(
						'qpuSecondsInput'
					);

					cy.get('@qpuSecondsInput').clear();
					cy.get('@qpuSecondsInput').type(`${payload.qpu_seconds}`);

					// delete all user emails
					project.user_emails.forEach(() => {
						cy.get(`[data-cy-multi-input-close-btn=0]`).click();
					});

					// create new email fields
					payload.user_emails.forEach(() => {
						cy.get('@emailAddBtn').click();
					});

					// update emails
					payload.user_emails.forEach((email, index) => {
						cy.get(
							`[data-cy-multi-input="User Emails"] [data-cy-inner-input=${index}]`
						).clear();
						cy.get(
							`[data-cy-multi-input="User Emails"] [data-cy-inner-input=${index}]`
						).type(email);
					});

					cy.get('[data-cy-header-btn]').click();
					cy.get('[data-cy-header-btn]')
						.should('contain.text', 'Saving...')
						.should('be.disabled');

					cy.url().should('match', /^http\:\/\/localhost\:3000\/projects\/\w+$/);

					cy.get('[data-cy-project-section="External ID"]').within(() => {
						cy.get('p').eq(1).should('have.text', project.ext_id);
					});

					cy.get('[data-cy-project-section="QPU Seconds"]').within(() => {
						cy.get('p').eq(1).should('have.text', payload.qpu_seconds);
					});

					cy.get('[data-cy-project-section="Users"]').within(() => {
						payload.user_emails.forEach((email, index) => {
							cy.get('p')
								.eq(index + 1)
								.should('have.text', email);
						});
					});
				});
		});
	});
});
