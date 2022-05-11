describe('boxplot component', () => {
	it('displays datepicker', () => {
		cy.visit('/Pingu?type=Boxplot');
		cy.wait(3000).then(() => {
			cy.get('[data-cy-date-picker]').should('exist');
		});
	});
	it('displays box plot', () => {
		cy.visit('/Pingu?type=Boxplot');
		cy.wait(3000).then(() => {
			cy.get('[data-cy-box-plot]').should('exist');
		});
	});
});
