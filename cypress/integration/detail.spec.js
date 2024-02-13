import { getApiRoutes } from '../../src/utils/apiClient';

describe('detail page', () => {
	beforeEach(() => {
		const apiRoutes = getApiRoutes(Cypress.env('apiBaseUrl'));
		cy.intercept('GET', apiRoutes.devices, {
			fixture: 'devices.json'
		}).as('allDeviceData');
		cy.intercept('GET', apiRoutes.statuses, {
			fixture: 'statuses.json'
		}).as('allStatusData');

		cy.intercept('GET', apiRoutes.device('Luki'), {
			fixture: 'deviceLuki.json'
		}).as('lukiDeviceData');
		cy.intercept('GET', apiRoutes.type1('Luki'), {
			fixture: 'type1.json'
		}).as('lukiType1Data');

		cy.visit('/Luki');
		cy.wait('@lukiDeviceData');
	});

	it('renders sidepanel', () => {
		cy.fixture('deviceLuki.json').then((device) => {
			cy.get('[data-cy-sidepanel]').within(() => {
				cy.get('[data-cy-name]').should('contain', device.backend_name);
				cy.get('[data-cy-status]').should(
					'contain',
					device.is_online ? 'online' : 'offline'
				);
				cy.get('[data-cy-version]').should('contain', device.backend_version);
				cy.get('[data-cy-qubits]').should('contain', device.n_qubits);
				cy.get('[data-cy-last-update]').should(
					'contain',
					device.last_update_date.split('T')[0]
				);
				cy.get('[data-cy-sample-name]').should('contain', device.sample_name);
			});
			cy.get('[data-cy-description]').should('contain', device.description);
		});
	});

	it('collapses sidepanel', () => {
		cy.wait(1000);
		cy.get('[data-cy-collapse-button]').click();
		cy.get('[data-cy-sidepanel]').should('not.exist');
		cy.get('[data-cy-expand-button]').click();
		cy.get('[data-cy-sidepanel]').should('exist');
	});
});
