
describe('boxplot component', () => {
    it('displays datepicker', () => {
        cy.visit('/Pingu?type=Boxplot');
        cy.wait(3000).then(() => {
            cy.get('[data-cy-date-picket]').should('exists')
        });
    });
    it('displays box plot', () => {
        use
    })


});