// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

Cypress.Commands.add('attrStartsWith', { prevSubject: 'element' }, (subject, attr, value) => {
	cy.get(subject)
		.should('have.attr', attr)
		.then((actual) => expect(actual.startsWith(value)).to.be.true);
	return cy.get(subject);
});

Cypress.Commands.add('attr', { prevSubject: 'element' }, (subject, attr) => {
	return cy.get(subject).invoke('attr', attr);
});

Cypress.Commands.add('startsWith', { prevSubject: true }, (subject, value) => {
	expect(subject.startsWith(value)).to.be.true;
});
