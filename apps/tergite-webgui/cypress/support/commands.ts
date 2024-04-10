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

// @ts-ignore
Cypress.Commands.add('attr', { prevSubject: 'element' }, (subject, value) => {
	return subject.attr(value);
});

// @ts-ignore
Cypress.Commands.add('isCloseTo', { prevSubject: true }, (subject, value, errorMargin) => {
	const subjectAsNumber = parseFloat(`${subject}`);
	const valueAsNumber = parseFloat(`${value}`);
	// add 1 to avoid dividing by 0
	const offset = valueAsNumber === 0 ? 1 : 0;
	const quotient = (subjectAsNumber + offset) / (valueAsNumber + offset);

	expect(Math.abs(1 - quotient), `expected ${value}, got ${subject}`).to.be.lessThan(errorMargin);
});
