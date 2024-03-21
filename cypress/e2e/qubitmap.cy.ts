import { getApiRoutes } from '../../src/utils/api';
import meResponses from '../fixtures/meResponses.json';
import { generateJwt } from '../support/utils';

meResponses.forEach((resp) => {
	const user = resp.body;
	const id = user.id ?? 'anonymous';
	const isAuthenticated = !!user.id;
	const url = 'http://localhost:3000/Luki?type=Qubitmap';

	describe(`Qubitmap screen for user ${id}`, () => {
		beforeEach(() => {
			const baseUrl = Cypress.env('API_BASE_URL');
			const oauthConfigFile = Cypress.env('AUTH_CONFIG_FILE');
			const landingPageUrl = Cypress.env('LANDING_ENDPOINT');
			const apiRoutes = getApiRoutes(baseUrl);

			cy.viewport('macbook-15');
			cy.intercept('GET', `${apiRoutes.internalApi}/me`).as('me-request');

			cy.intercept('GET', `${landingPageUrl}/**`, (req) => {
				req.reply('Authenticating');
			}).as('landing-page-request');

			cy.intercept('GET', apiRoutes.device('Luki'), {
				fixture: 'deviceLuki.json'
			}).as('luki-device-request');

			cy.intercept('GET', apiRoutes.devices, {
				fixture: 'devices.json'
			}).as('devices-request');

			cy.intercept('GET', apiRoutes.statuses, {
				fixture: 'statuses.json'
			}).as('statuses-request');

			cy.intercept('GET', apiRoutes.type1('Luki'), {
				fixture: 'type1.json'
			}).as('luki-type1-request');

			if (user.id) {
				cy.task('readToml', oauthConfigFile).then((oauthConfig: Record<string, any>) => {
					cy.wrap(generateJwt(user, oauthConfig)).then((jwtToken: string) => {
						const generalConfig = oauthConfig.general || {};
						const cookieName = generalConfig.cookie_name;
						const domain = generalConfig.cookie_domain;

						cy.setCookie(cookieName, jwtToken, {
							domain,
							httpOnly: true,
							secure: false,
							sameSite: 'lax'
						});
					});
				});
			}

			cy.visit(url);
			isAuthenticated && cy.wait('@me-request');
			isAuthenticated && cy.wait('@luki-device-request');
			isAuthenticated && cy.wait('@luki-type1-request');
		});

		isAuthenticated &&
			it('renders maps', () => {
				cy.get('[data-cy-map="node"]').should('exist');
				cy.get('[data-cy-map="link"]').should('exist');
			});

		isAuthenticated &&
			it('renders radio buttons', () => {
				cy.get('[data-cy-radiobutton="node"]').should('exist');
				cy.get('[data-cy-radiobutton="link"]').should('exist');
			});

		isAuthenticated &&
			it('renders dropdowns', () => {
				cy.get('[data-cy-dropdown="link"]').should('exist');
				cy.get('[data-cy-dropdown="node"]').should('exist');
			});

		isAuthenticated &&
			it('renders qubits in the correct positions', () => {
				cy.fixture('qubitPositions.json').then((positions) => {
					positions.forEach((position, index) => {
						cy.get(`[data-cy-qubitmap-node-id=${index}]`).within(() => {
							cy.get('rect').attr('x').startsWith(position.x);
							cy.get('rect').attr('y').startsWith(position.y);
						});
					});
				});
			});

		isAuthenticated &&
			it('renders gates in the correct positions', () => {
				cy.fixture('gatePositions.json').then((positions) => {
					let index = 5;
					positions.forEach((position) => {
						cy.get(`[data-cy-qubitmap-link-id=${index++}]`).within(() => {
							cy.get('line').attr('x1').startsWith(position.x1);
							cy.get('line').attr('x2').startsWith(position.x2);
							cy.get('line').attr('y1').startsWith(position.y1);
							cy.get('line').attr('y2').startsWith(position.y2);
						});
					});
				});
			});

		isAuthenticated &&
			it('displays the values of the qubits', () => {
				cy.fixture('qubitValues.json').then((values) => {
					cy.get('[data-cy-map="node"]').within(() => {
						values.forEach((value, index) => {
							cy.get(`[data-cy-qubitmap-node-id=${index}]`)
								.find('tspan')
								.should('contain.html', value);
						});
					});
				});
			});

		isAuthenticated &&
			it('displays the values of the gates', () => {
				cy.fixture('gateValues.json').then((values) => {
					cy.get('[data-cy-map="link"]').within(() => {
						let index = 5;
						values.forEach((value) => {
							cy.get(`[data-cy-qubitmap-link-id=${index++}]`)
								.find('tspan')
								.should('contain.html', value);
						});
					});
				});
			});

		isAuthenticated &&
			it('displays tool tip when hovering over qubit', () => {
				cy.get(`[data-cy-qubitmap-node-id="0"]`).trigger('mousemove');
				cy.get('[data-cy-tooltip]').should('exist');
			});

		isAuthenticated &&
			it('displays tool tip when hovering over gate', () => {
				cy.get(`[data-cy-qubitmap-link-id="6"]`).trigger('mousemove');
				cy.get('[data-cy-tooltip]').should('exist');
			});

		isAuthenticated &&
			it('dropdown contains the properties of qubits when qubit option in radio button is clicked', () => {
				cy.fixture('dropDownOptions.json').then((values) => {
					cy.get('[data-cy-dropdown="node"]').within(() => {
						values.forEach((value) => {
							cy.get('option').should('contain.text', value);
						});
					});
				});
			});

		isAuthenticated &&
			it('selecting a propety displays the correct value on the map', () => {
				cy.fixture('resonatorValues.json').then((values) => {
					cy.get('[data-cy-radiobutton="node"]').find('[data-cy-index="2"]').click();
					cy.get('[data-cy-map="node"]').within(() => {
						values.forEach((value, index) => {
							cy.get(`[data-cy-qubitmap-node-id=${index}]`).should('contain', value);
						});
					});
				});
			});

		!isAuthenticated &&
			it('renders not authenticated error message', () => {
				cy.get('[data-cy-not-authenticated]').should('contain', 'Not Authenticated');
			});

		!isAuthenticated &&
			it('redirects to landing page login screen', () => {
				cy.wait('@landing-page-request');
				cy.url().should('equal', `http://localhost:3001/login?next=${url}`);
			});
	});
});
