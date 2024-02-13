import { getApiRoutes } from '../../src/utils/apiClient';

describe('qubitmap', () => {
	beforeEach(() => {
		const apiRoutes = getApiRoutes(Cypress.env('apiBaseUrl'));
		cy.viewport('macbook-15');
		cy.intercept('GET', apiRoutes.devices, {
			fixture: 'devices.json'
		}).as('allDeviceData');
		cy.intercept('GET', apiRoutes.statuses, {
			fixture: 'statuses.json'
		}).as('allStatusData');

		cy.intercept('GET', apiRoutes.device('Luki'), {
			fixture: 'deviceLuki.json'
		}).as('lukiDeviceData');
		cy.intercept('GET', apiRoutes.type1('Luki'), {
			fixture: 'type1.json'
		}).as('lukiType1Data');
		cy.visit('/Luki');

		cy.wait(1000);
		cy.wait('@lukiDeviceData');
		cy.wait(1000);
		cy.wait('@lukiType1Data');
	});

	it('renders maps', () => {
		cy.get('[data-cy-map="node"]').should('exist');
		cy.get('[data-cy-map="link"]').should('exist');
	});

	it('renders radio buttons', () => {
		cy.get('[data-cy-radiobutton="node"]').should('exist');
		cy.get('[data-cy-radiobutton="link"]').should('exist');
	});

	it('renders dropdowns', () => {
		cy.get('[data-cy-dropdown="link"]').should('exist');
		cy.get('[data-cy-dropdown="node"]').should('exist');
		// cy.get('[data-cy-dropdown="link"]').trigger('mouseover');
	});

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

	it('displays tool tip when hovering over qubit', () => {
		cy.wait(2000);
		cy.get(`[data-cy-qubitmap-node-id="0"]`).trigger('mousemove');
		cy.get('[data-cy-tooltip]').should('exist');
	});

	it('displays tool tip when hovering over gate', () => {
		cy.wait(2000);
		cy.get(`[data-cy-qubitmap-link-id="6"]`).trigger('mousemove');
		cy.get('[data-cy-tooltip]').should('exist');
	});

	it('dropdown contains the properties of qubits when qubit option in radio button is clicked', () => {
		cy.fixture('dropDownOptions.json').then((values) => {
			cy.get('[data-cy-dropdown="node"]').within(() => {
				values.forEach((value) => {
					cy.get('option').should('contain.text', value);
				});
			});
		});
	});

	it('selecting a propety displays the correct value on the map', () => {
		cy.fixture('resonatorValues.json').then((values) => {
			cy.get('[data-cy-radiobutton="node"]').find('#tabs-13--tab-2').click();
			cy.get('[data-cy-map="node"]').within(() => {
				values.forEach((value, index) => {
					cy.get(`[data-cy-qubitmap-node-id=${index}]`).should('contain', value);
				});
			});
		});
	});
});
