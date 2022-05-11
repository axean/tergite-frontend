describe('table page', () => {
	it('load tables', () => {
		cy.visit('/Pingu?type=Tableview');
		cy.wait(2000);
		cy.get('[data-cy-qubit-table]').should('exist');
	});

	it('Load qubit table', () => {
		cy.visit('/Pingu?type=Tableview');
		cy.wait(2000);
		cy.get('[data-index=0]').click();
		cy.wait(200);
		cy.get('[data-cy-qubit-table]').should('exist');
	});

	it('Load gate table', () => {
		cy.visit('/Pingu?type=Tableview');
		cy.wait(2000);
		cy.get('[data-index=1]').click();
		cy.wait(200);
		cy.get('[data-cy-gate-table]').should('exist');
	});

	it('Load coupler table', () => {
		cy.visit('/Pingu?type=Tableview');
		cy.wait(200);
		cy.get('[data-index=2]').click();
		cy.wait(200);
		cy.get('[data-cy-coupler-table]').should('exist');
	});

	it('Load coupler table', () => {
		cy.visit('/Pingu?type=Tableview');
		cy.wait(200);
		cy.get('[data-index=3]').click();
		cy.wait(200);
		cy.get('[data-cy-res-table]').should('exist');
	});
});
