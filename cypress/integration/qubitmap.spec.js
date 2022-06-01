import ApiRoutes from '../../src/utils/ApiRoutes';

describe('qubitmap', () => {
	beforeEach(() => {
		cy.viewport('macbook-15');
		cy.intercept('GET', ApiRoutes.devices, {
			fixture: 'devices.json'
		});
		cy.intercept('GET', ApiRoutes.statuses, {
			fixture: 'statuses.json'
		});

		cy.intercept('GET', ApiRoutes.device('Luki'), {
			fixture: 'deviceLuki.json'
		});
		cy.intercept('GET', ApiRoutes.type1('Luki'), {
			fixture: 'type1.json'
		});
		cy.visit('/Luki');
		cy.wait(1000);
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
					cy.get('rect')
						.should('have.attr', 'x', position.x)
						.and('have.attr', 'y', position.y);
				});
			});
		});
	});

	it('renders gates in the correct positions', () => {
		cy.fixture('gatePositions.json').then((positions) => {
			let index = 5;
			positions.forEach((position) => {
				cy.get(`[data-cy-qubitmap-link-id=${index++}]`).within(() => {
					cy.get('line')
						.should('have.attr', 'x1', position.x1)
						.and('have.attr', 'y1', position.y1)
						.and('have.attr', 'x2', position.x2)
						.and('have.attr', 'y2', position.y2);
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
		cy.get(`[data-cy-qubitmap-node-id="0"]`).trigger('mousemove');
		cy.get('[data-cy-tooltip]').should('exist');
	});
	it('displays tool tip when hovering over gate', () => {
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
