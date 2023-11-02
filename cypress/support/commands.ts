/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
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
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

export {};

Cypress.Commands.add('clearClipboard', () => {
	cy.window().then((win) => win.navigator.clipboard.writeText(''));
});

Cypress.Commands.add('clipboardContains', (value: string) => {
	cy.window().then((win) =>
		win.navigator.clipboard.readText().then((text) => {
			expect(text).to.eq(value);
		})
	);
});

Cypress.Commands.add('clipboardMatches', (value: RegExp) => {
	cy.window().then((win) =>
		win.navigator.clipboard.readText().then((text) => {
			expect(text).to.match(value);
		})
	);
});

declare global {
	namespace Cypress {
		interface Chainable {
			/**
			 * Custom command to compare text on clipboard with the value
			 * @example cy.clipboardContains('Hello World')
			 */
			clipboardContains(value: string): Chainable<void>;

			/**
			 * Custom command to match text on clipboard with a regular expression
			 * @example cy.clipboardMatches(/^Hello\s+World$/)
			 */
			clipboardMatches(value: RegExp): Chainable<void>;

			/**
			 * Custom command to clear the clipboard
			 * @example cy.clearClipboard()
			 */
			clearClipboard(): Chainable<void>;
		}
	}
}
