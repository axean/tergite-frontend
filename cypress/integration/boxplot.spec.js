import { getApiRoutes } from '../../src/utils/apiClient';

describe('boxplot component', () => {
	beforeEach(() => {
		const apiRoutes = getApiRoutes(Cypress.env('apiBaseUrl'));

		cy.intercept('GET', apiRoutes.device('Luki'), {
			fixture: 'deviceLuki.json'
		}).as('lukiDeviceData');
		cy.intercept('GET', `${apiRoutes.type3('Luki')}**`, {
			fixture: 'type3.json'
		}).as('lukiType3Data');

		cy.visit('/Luki?type=Boxplot');
		cy.wait(1000);
	});

	it('displays datepicker', () => {
		cy.wait(3000).then(() => {
			cy.get('[data-cy-date-picker]').should('exist');
		});
	});

	it('displays box plot', () => {
		cy.wait(3000).then(() => {
			cy.get('[data-cy-box-plot]').should('exist');
		});
	});
});
