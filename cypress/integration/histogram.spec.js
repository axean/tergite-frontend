import ApiRoutes from '../../src/utils/ApiRoutes';

describe('histogram component', () => {
	it('displays radiobuttons', () => {
		cy.visit('/Pingu?type=Histogram');
		cy.wait(3000).then(() => {
			cy.get('[data-cy-radiobutton]').should('exist');
		});
	});
	it('displays datepicker', () => {
		cy.visit('/Pingu?type=Histogram');
		cy.wait(3000).then(() => {
			cy.get('[data-cy-date-picker]').should('exist');
		});
	});
	it('displays histogram', () => {
		cy.visit('/Pingu?type=Histogram');
		cy.wait(3000).then(() => {
			cy.get('[data-cy-histogram]').should('exist');
		});
	});
});

