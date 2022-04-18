describe('Pages do not crash', () => {
	it('displays index page', () => {
		cy.visit('/');
		cy.wait(1000).then(() => {
			cy.get('#main-navbar').should('exist');
		});
	});
	it('displays device page', () => {
		cy.visit('/Pingu');
		cy.wait(1000).then(() => {
			cy.get('#main-navbar').should('exist');
		});
	});
	it('displays qubitmap page', () => {
		cy.visit('/Pingu?type=Qubitmap');
		cy.wait(1000).then(() => {
			cy.get('#main-navbar').should('exist');
		});
	});
	it('displays histogram page', () => {
		cy.visit('/Pingu?type=Histogram');
		cy.wait(1000).then(() => {
			cy.get('#main-navbar').should('exist');
		});
	});
	it('displays graphdeviation page', () => {
		cy.visit('/Pingu?type=Graphdeviation');
		cy.wait(1000).then(() => {
			cy.get('#main-navbar').should('exist');
		});
	});
	it('displays linegraph page', () => {
		cy.visit('/Pingu?type=Linegraph');
		cy.wait(1000).then(() => {});
		it('displays tableview page', () => {
			cy.visit('/Pingu?type=Tableview');
			cy.get('#main-navbar').should('exist');
		});
		it('displays cityplot page', () => {
			cy.visit('/Pingu?type=Cityplot');
		});
	});
});
