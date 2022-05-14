describe('Line chart visualization displays', () => {
	it('display domain label', () => {
		cy.visit('/Pingu?type=Linegraph');
		cy.wait(2000).then(() => {
			cy.get('#domain-label').should('exist');
		});
	});
	it('display domain radio buttons', () => {
		cy.visit('/Pingu?type=Linegraph');
		cy.wait(2000).then(() => {
			cy.get('#domain-radio-btns').should('exist');
		});
	});
	it('display domain select', () => {
		cy.visit('/Pingu?type=Linegraph');
		cy.wait(2000).then(() => {
			cy.get('#domain-select').should('exist');
		});
	});
	it('display codomain label', () => {
		cy.visit('/Pingu?type=Linegraph');
		cy.wait(2000).then(() => {
			cy.get('#codomain-label').should('exist');
		});
	});
	it('display codomain radio buttons', () => {
		cy.visit('/Pingu?type=Linegraph');
		cy.wait(2000).then(() => {
			cy.get('#codomain-radio-btns').should('exist');
		});
	});
	it('display codomain select', () => {
		cy.visit('/Pingu?type=Linegraph');
		cy.wait(2000).then(() => {
			cy.get('#codomain-select').should('exist');
		});
	});
});
