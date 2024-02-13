import { getApiRoutes } from '../../src/utils/apiClient';

describe('table page', () => {
	beforeEach(() => {
		const apiRoutes = getApiRoutes(Cypress.env('apiBaseUrl'));
		cy.intercept('GET', apiRoutes.device('Luki'), {
			fixture: 'deviceLuki.json'
		}).as('lukiDeviceData');
		cy.intercept('GET', `${apiRoutes.devices}/Luki/data`, {
			fixture: 'lukiAllData.json'
		}).as('lukiAllData');

		cy.visit('/Luki?type=Tableview');

		cy.wait(1000);
		cy.wait('@lukiDeviceData');
		cy.wait(1000);
		cy.wait('@lukiAllData');
	});

	it('load tables', () => {
		cy.get('[data-cy-qubit-table]').should('exist');
	});

	it('Load qubit table', () => {
		cy.get('[data-index=0]').click();
		cy.wait(200);
		cy.get('[data-cy-qubit-table]').should('exist');
	});

	it('Load gate table', () => {
		cy.get('[data-index=1]').click();
		cy.wait(200);
		cy.get('[data-cy-gate-table]').should('exist');
	});

	it('Load coupler table', () => {
		cy.get('[data-index=2]').click();
		cy.wait(200);
		cy.get('[data-cy-coupler-table]').should('exist');
	});

	it('Load res table', () => {
		cy.get('[data-index=3]').click();
		cy.wait(200);
		cy.get('[data-cy-res-table]').should('exist');
	});
});
