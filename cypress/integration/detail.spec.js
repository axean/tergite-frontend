import ApiRoutes from '../../src/utils/ApiRoutes';

describe('detail page', () => {
	beforeEach(() => {
		cy.intercept('GET', ApiRoutes.devices, {
			fixture: 'devices.json'
		});
		cy.intercept('GET', ApiRoutes.statuses, {
			fixture: 'statuses.json'
		});
	});
});
