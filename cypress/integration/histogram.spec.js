import { getApiRoutes } from '../../src/utils/apiClient';

describe('histogram component', () => {
	beforeEach(() => {
		const apiRoutes = getApiRoutes(Cypress.env('apiBaseUrl'));

		cy.intercept('GET', apiRoutes.device('Luki'), {
			fixture: 'deviceLuki.json'
		}).as('lukiDeviceData');
		cy.intercept('GET', `${apiRoutes.type2('Luki')}**`, {
			fixture: 'type2.json'
		}).as('lukiType2Data');

		cy.visit('/Luki?type=Histogram');
		cy.wait(1000);
	});

	it('displays radiobuttons', () => {
		cy.wait(3000).then(() => {
			cy.get('[data-cy-radiobutton]').should('exist');
		});
	});

	it('displays datepicker', () => {
		cy.wait(3000).then(() => {
			cy.get('[data-cy-date-picker]').should('exist');
		});
	});

	it('displays histogram t1', () => {
		cy.wait(3000).then(() => {
			cy.get('[data-cy-index=0]').click();
			cy.get("[data-cy-histogram='T1(us)']").should('exist');
		});
	});

	it('displays histogram t2', () => {
		cy.wait(3000).then(() => {
			cy.get('[data-cy-index=1]').click();
			cy.get("[data-cy-histogram='T2(us)']").should('exist');
		});
	});

	it('displays histogram tphi', () => {
		cy.wait(3000).then(() => {
			cy.get("[data-cy-index='2']").click();
			cy.get("[data-cy-histogram='TPhi(us)']").should('exist');
		});
	});
});
