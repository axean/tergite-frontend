import ApiRoutes from '../../src/utils/ApiRoutes';

describe('index page', () => {
	beforeEach(() => {
		cy.intercept('GET', ApiRoutes.devices, {
			fixture: 'devices.json'
		});
		cy.intercept('GET', ApiRoutes.statuses, {
			fixture: 'statuses.json'
		});
		cy.visit('/');
		cy.wait(1000);
	});
	it('renders navbar', () => {
		cy.get('[data-cy-main-navbar]')
			.find('h1')
			.should('contain', 'WAQCT | Wallenberg Centre for Quantum Technology');
	});
	it('renders systems online', () => {
		cy.get('[data-cy-online-statuses]').within(() => {
			cy.get('[data-cy-circle-text]').should('contain', '100%');
			cy.get('[data-cy-systems-online]').should('contain', '1');
		});
	});

	it('renders device', () => {
		cy.fixture('devices.json').then((devices) => {
			const device = devices[0];
			cy.get('[data-cy-devices]').within(() => {
				cy.get('[data-cy-device-name]').should('contain', device['backend_name']);
				cy.get('[data-cy-device-status]').should(
					'contain',
					device['is_online'] ? 'online' : 'offline'
				);
				cy.get('[data-cy-device-version]').should('contain', device['backend_version']);
				cy.get('[data-cy-device-n-qubits]').should('contain', device['n_qubits']);
				cy.get('[data-cy-device-last-update]').should(
					'contain',
					device['last_update_date'].split('T')[0]
				);
			});
		});
	});

	it('renders sorted searched', () => {
		cy.get('[data-cy-devices-search]').type('Pingu');
		cy.get('[data-cy-devices]').within(() => {
			cy.get('[data-cy-device-name]').should('contain', 'Pingu');
		});
	});
});
