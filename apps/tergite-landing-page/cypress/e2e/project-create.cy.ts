import meResponses from '../fixtures/meResponses.json';
import projectPayloads from '../fixtures/project-create.json';
import { API } from '../../src/types';
import utils from '../../utils';
import { testNavigation } from './navigation';

testNavigation(`http://localhost:3000/projects/create`);

meResponses.forEach((resp) => {
	const isNoAuth = resp.statusCode == 403;
	const user = resp.body as API.User;
	const id = user.id ?? 'anonymous';
	const isAdmin = user.roles?.includes(API.UserRole.ADMIN);
	const isNormalUser = isAdmin === false;
	const dummyEmails = ['j@ex.com', 'h@d.com', 'me@s.com', 'p@g.com'];

	projectPayloads.forEach((project) => {
		describe(`project '${project.ext_id}' creation page for user '${id}'`, () => {
			before(() => {
				cy.readFile('./.env.test', 'utf-8').then((str) => utils.loadEnvFromString(str));
			});

			beforeEach(() => {
				cy.request(`http://localhost:8002/refreshed-db`);

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

				cy.visit(`http://localhost:3000/projects/create`);
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
				it('renders empty text input for external ID', () => {
					cy.get('[data-cy-input="External ID"]').within(() => {
						cy.get('[data-cy-label]').should('contain.text', 'External ID');

						cy.get('[data-cy-inner-input]')
							.should('have.attr', 'type', 'text')
							.should('have.attr', 'required', 'required')
							.should('be.empty');
					});
				});

			isAdmin &&
				it('renders empty number input for QPU Seconds', () => {
					cy.get('[data-cy-input="QPU Seconds"]').within(() => {
						cy.get('[data-cy-label]').should('contain.text', 'QPU Seconds');

						cy.get('[data-cy-inner-input]')
							.should('have.attr', 'type', 'number')
							.should('have.attr', 'required', 'required')
							.should('be.empty');
					});
				});

			isAdmin &&
				it('renders empty multi-input for User Emails', () => {
					cy.get('[data-cy-multi-input="User Emails"]').within(() => {
						cy.get('[data-cy-label]').should('contain.text', 'User Emails');

						cy.get('[data-cy-inner-input]').should('not.exist');
						cy.get('[data-cy-input-wrapper]').should('not.exist');

						cy.get('[data-cy-multi-input-add-btn]').should('contain.text', '+');
					});
				});

			isAdmin &&
				it('multi-input has close buttons to remove emails', () => {
					cy.get('[data-cy-multi-input="User Emails"]').within(() => {
						// create the multiple inputs
						dummyEmails.forEach(() => {
							cy.get('[data-cy-multi-input-add-btn]').click();
						});

						// fill in the inputs
						dummyEmails.forEach((email, index) => {
							cy.get(`[data-cy-inner-input=${index}]`).type(email);
						});

						cy.get('[data-cy-input-wrapper]').should('have.length', 4);

						// close the second and the last
						cy.get('[data-cy-multi-input-close-btn=1]').click();
						cy.get('[data-cy-multi-input-close-btn=2]').click();

						// show that only the first and the third are left
						cy.get('[data-cy-input-wrapper]').should('have.length', 2);

						cy.get('[data-cy-inner-input=0]')
							.should('have.attr', 'value', dummyEmails[0])
							.should('have.attr', 'required', 'required');

						cy.get('[data-cy-inner-input=1]')
							.should('have.attr', 'value', dummyEmails[2])
							.should('have.attr', 'required', 'required');
					});
				});

			isAdmin &&
				it('Feeding in data and saving creates project', () => {
					cy.get('[data-cy-input="External ID"] [data-cy-inner-input]').as('extIdInput');
					cy.get('[data-cy-multi-input="User Emails"] [data-cy-multi-input-add-btn]').as(
						'emailAddBtn'
					);
					cy.get('[data-cy-input="QPU Seconds"] [data-cy-inner-input]').as(
						'qpuSecondsInput'
					);

					cy.get('@extIdInput').clear();
					cy.get('@extIdInput').type(project.ext_id);

					cy.get('@qpuSecondsInput').clear();
					cy.get('@qpuSecondsInput').type(`${project.qpu_seconds}`);

					project.user_emails.forEach(() => {
						cy.get('@emailAddBtn').click();
					});

					project.user_emails.forEach((email, index) => {
						cy.get(
							`[data-cy-multi-input="User Emails"] [data-cy-inner-input=${index}]`
						).clear();
						cy.get(
							`[data-cy-multi-input="User Emails"] [data-cy-inner-input=${index}]`
						).type(email);
					});

					cy.get('[data-cy-header-btn] [data-cy-spinner]').should('not.exist');
					cy.get('[data-cy-header-btn]').click();
					cy.get('[data-cy-header-btn]').should('be.disabled');
					cy.get('[data-cy-header-btn] [data-cy-spinner]').should('exist');

					cy.url().should('match', /^http\:\/\/localhost\:3000\/projects\/\d+$/);

					cy.get('[data-cy-project-section="External ID"]').within(() => {
						cy.get('p').eq(1).should('have.text', project.ext_id);
					});

					cy.get('[data-cy-project-section="QPU Seconds"]').within(() => {
						cy.get('p').eq(1).should('have.text', project.qpu_seconds);
					});

					cy.get('[data-cy-project-section="Users"]').within(() => {
						project.user_emails.forEach((email, index) => {
							cy.get('p')
								.eq(index + 1)
								.should('have.text', email);
						});
					});
				});
		});
	});
});
