describe('table page', () => {
	it('load tables', () => {
        cy.visit('/Pingu?type=Tableview')
        cy.wait(100)
        cy.get('data-cy-qubit-table')
    })
});