import { getApiRoutes } from '../../src/utils/apiClient';

describe('Line chart visualization displays', () => {
	beforeEach(() => {
		const apiRoutes = getApiRoutes(Cypress.env('apiBaseUrl'));

		cy.intercept('GET', apiRoutes.device('Luki'), {
			fixture: 'deviceLuki.json'
		}).as('lukiDeviceData');
		cy.intercept('GET', `${apiRoutes.devices}/Luki/type4_domain`, {
			fixture: 'type4_domain.json'
		}).as('lukiType4DomainData');
		cy.intercept('GET', `${apiRoutes.devices}/Luki/type4_codomain`, {
			fixture: 'type4_codomain.json'
		}).as('lukiType4CodomainData');

		cy.visit('/Luki?type=Linegraph');
		cy.wait(1000);
	});

	it('display domain label', () => {
		cy.wait(2000).then(() => {
			cy.get('#domain-label').should('exist');
		});
	});

	it('display domain radio buttons', () => {
		cy.wait(2000).then(() => {
			cy.get('#domain-radio-btns').should('exist');
		});
	});

	it('display domain select', () => {
		cy.wait(2000).then(() => {
			cy.get('#domain-select').should('exist');
		});
	});

	it('display codomain label', () => {
		cy.wait(2000).then(() => {
			cy.get('#codomain-label').should('exist');
		});
	});

	it('display codomain radio buttons', () => {
		cy.wait(2000).then(() => {
			cy.get('#codomain-radio-btns').should('exist');
		});
	});

	it('display codomain select', () => {
		cy.wait(2000).then(() => {
			cy.get('#codomain-select').should('exist');
		});
	});
});
