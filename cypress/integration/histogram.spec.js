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
	it('displays histogram t1', () => {
		cy.visit('/Pingu?type=Histogram');
		cy.wait(3000).then(() => {
			cy.get('[data-index=0]').click();
			cy.get('[data-cy-histogram=T1]').should('exist');
		});
	});
	it('displays histogram t2', () => {
		cy.visit('/Pingu?type=Histogram');
		cy.wait(3000).then(() => {
			cy.get('[data-index=1]').click();
			cy.get('[data-cy-histogram=T2]').should('exist');
		});
	});
	it('displays histogram tphi', () => {
		cy.visit('/Pingu?type=Histogram');
		cy.wait(3000).then(() => {
			cy.get('data-index=2').click();
			cy.get('[data-cy-histogram=T' + '\u03C6' + ']').should('exist');
		});
	});
});
