import meResponses from '../fixtures/meResponses.json';
import tokens from '../fixtures/tokens.json';
import { API } from '../../src/types';
import utils from '../../utils';
import { testNavigation } from './navigation';

testNavigation(`http://localhost:3000/tokens/create`);

meResponses.slice(undefined, 1).forEach((resp) => {
	const user = resp.body as API.User;
	const id = user.id ?? 'anonymous';
	const isAuthenticated = !!user.id;
	const myTokens = tokens.filter(({ user_id }) => id === user_id);

	myTokens.forEach((token) => {
		describe(`token '${token.title}' for project '${token.project_ext_id}' creation page for user '${id}'`, () => {
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

				cy.visit(`http://localhost:3000/tokens/create`);
			});

			!isAuthenticated &&
				it('renders Not Found for unauthenticated', () => {
					cy.get('[data-cy-content]').within(() => {
						cy.get('[data-cy-error]').should('contain', 'Not Found');
					});
				});

			isAuthenticated &&
				it('renders generate button', () => {
					cy.get('[data-cy-header-btn]').should('contain.text', 'Generate');
				});

			isAuthenticated &&
				it('renders empty text input for token name', () => {
					cy.get('[data-cy-input="Name"]').within(() => {
						cy.get('[data-cy-label]').should('contain.text', 'Name');

						cy.get('[data-cy-inner-input]')
							.should('have.attr', 'type', 'text')
							.should('have.attr', 'required', 'required')
							.should('be.empty');
					});
				});

			isAuthenticated &&
				it('renders empty text input for token project', () => {
					cy.get('[data-cy-input="Project"]').within(() => {
						cy.get('[data-cy-label]').should('contain.text', 'Project');

						cy.get('[data-cy-inner-input]')
							.should('have.attr', 'type', 'text')
							.should('have.attr', 'required', 'required')
							.should('be.empty');
					});
				});

			isAuthenticated &&
				it('renders empty number input for Lifespan', () => {
					cy.get('[data-cy-input="Lifespan (Seconds)"]').within(() => {
						cy.get('[data-cy-label]').should('contain.text', 'Lifespan (Seconds)');

						cy.get('[data-cy-inner-input]')
							.should('have.attr', 'type', 'number')
							.should('have.attr', 'required', 'required')
							.should('be.empty');
					});
				});

			isAuthenticated &&
				it('Feeding in data and saving creates token', () => {
					cy.get('[data-cy-input="Name"] [data-cy-inner-input]').as('tokenNameInput');
					cy.get('[data-cy-input="Project"] [data-cy-inner-input]').as(
						'projectExtIdInput'
					);
					cy.get('[data-cy-input="Lifespan (Seconds)"] [data-cy-inner-input]').as(
						'lifespanInput'
					);

					cy.get('@tokenNameInput').clear();
					cy.get('@tokenNameInput').type(token.title);

					cy.get('@projectExtIdInput').clear();
					cy.get('@projectExtIdInput').type(`${token.project_ext_id}`);

					cy.get('@lifespanInput').clear();
					cy.get('@lifespanInput').type(`${token.lifespan_seconds}`);

					cy.get('[data-cy-header-btn] [data-cy-spinner]').should('not.exist');
					cy.get('[data-cy-header-btn]').click();
					cy.get('[data-cy-header-btn]').should('be.disabled');
					cy.get('[data-cy-header-btn] [data-cy-spinner]').should('not.exist');

					cy.get('[data-cy-overlay] [data-cy-card]')
						.within(() => {
							cy.get('[data-token-alert]')
								.should('be.visible')
								.should(
									'contain.text',
									'Here is your new token. Copy it and keep it securely. It will not be shown to you again'
								);

							cy.get('[data-cy-token-display]')
								.should('be.visible')
								.and('have.css', 'white-space', 'pre');

							cy.get('[data-cy-token-display]')
								.invoke('text')
								.should(
									'match',
									/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
								);

							cy.get('[data-cy-copy-btn]').should('contain.text', 'copy');

							// to focus on window: to avoid NotAllowed error: window not in focus
							// See: https://stackoverflow.com/questions/56306153/domexception-on-calling-navigator-clipboard-readtext#answer-61216014
							// See also: https://github.com/cypress-io/cypress/issues/18198#issuecomment-1003756021
							// See also: https://github.com/cypress-io/cypress/issues/18198#issuecomment-1613998336
							cy.realPress('Tab');

							cy.clearClipboard();
							cy.clipboardContains('');

							cy.get('[data-cy-copy-btn]').realClick();

							cy.get('[data-cy-token-display]')
								.invoke('text')
								.then((value) => {
									cy.window().focus();
									cy.clipboardContains(value);
								});

							cy.clipboardMatches(
								/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
							);

							// close the overlay
							cy.get('[data-cy-close-btn]').click();
						})
						.then(() => {
							cy.get('[data-cy-overlay]').should('not.exist');
							cy.get('@tokenNameInput').should('have.attr', 'value', '');
							cy.get('@projectExtIdInput').should('have.attr', 'value', '');
							cy.get('@lifespanInput').should('have.attr', 'value', '0');
						});
				});
		});
	});
});
