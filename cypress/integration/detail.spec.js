import ApiRoutes from '../../src/utils/ApiRoutes';

describe('detail page', () => {
	beforeEach(() => {
		cy.intercept('GET', ApiRoutes.devices, {
			fixture: 'devices.json'
		});
		cy.intercept('GET', ApiRoutes.statuses, {
			fixture: 'statuses.json'
		});

		cy.intercept('GET', ApiRoutes.device('Luki'), {
			fixture: 'deviceLuki.json'
		});
		cy.intercept('GET', ApiRoutes.type1('Luki'), {
			fixture: 'type1.json'
		});

		cy.visit('/Luki');
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
		// data-cy-collapse-button
		cy.get('[data-cy-collapse-button]').click();
		cy.get('[data-cy-sidepanel]').should('not.exist');
		cy.get('[data-cy-expand-button]').click();
		cy.get('[data-cy-sidepanel]').should('exist');
	});
});
