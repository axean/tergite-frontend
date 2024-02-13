import { getApiRoutes } from '../../src/utils/apiClient';

describe('index page', () => {
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

		cy.visit('/');
		cy.wait(1000);
	});

	it('renders navbar', () => {
		cy.get('[data-cy-main-navbar]')
			.find('h1')
			.should('contain', 'WAQCT | Wallenberg Centre for Quantum Technology');
	});

	it('renders systems online', () => {
		cy.wait('@allStatusData');
		cy.get('[data-cy-online-statuses]').within(() => {
			cy.get('[data-cy-circle-text]').should('contain', '100%');
			cy.get('[data-cy-systems-online]').should('contain', '1');
		});
	});

	it('renders device', () => {
		cy.wait('@allDeviceData');
		cy.fixture('devices.json').then((devices) => {
			const device = devices[1];
			cy.get('[data-cy-device]')
				.first()
				.within(() => {
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

	it('renders searched searched', () => {
		cy.wait('@allDeviceData');
		cy.get('[data-cy-devices-search]').type('Pingu');
		cy.get('[data-cy-device]')
			.first()
			.within(() => {
				cy.get('[data-cy-device-name]').should('contain', 'Pingu');
			});
	});

	it('filters devices', () => {
		cy.wait('@allDeviceData');
		cy.get('[data-cy-filter-button]').click();
		cy.get('[data-cy-filter-online]').click();
		cy.get('[data-cy-device]')
			.first()
			.within(() => {
				cy.get('[data-cy-device-status]').should('contain', 'offline');
			});
	});

	it('sorts devices by name', () => {
		cy.wait('@allDeviceData');
		cy.get('[data-cy-device]')
			.first()
			.within(() => {
				cy.get('[data-cy-device-name]').should('contain', 'Luki');
			});

		cy.get('[data-cy-sort-button]').click();
		cy.get('[data-cy-sort-order-desc]').click();
		cy.get('[data-cy-device]')
			.first()
			.within(() => {
				cy.get('[data-cy-device-name]').should('contain', 'Pingu');
			});
	});

	it('sorts devices by status', () => {
		cy.wait('@allDeviceData');
		cy.wait('@allStatusData');
		cy.get('[data-cy-sort-button]').click();
		cy.get('[data-cy-sort-status]').click();
		cy.get('[data-cy-device]')
			.first()
			.within(() => {
				cy.get('[data-cy-device-name]').should('contain', 'Pingu');
			});
	});

	it('sorts devices by online date', () => {
		cy.wait('@allDeviceData');
		cy.get('[data-cy-sort-button]').click();
		cy.get('[data-cy-sort-online-date]').click();
		cy.get('[data-cy-device]')
			.first()
			.within(() => {
				cy.get('[data-cy-device-name]').should('contain', 'Pingu');
			});
	});

	it('navigates to detail page', () => {
		cy.wait('@allDeviceData');
		cy.get('[data-cy-device]').first().click();
		cy.url().should('include', 'Luki');
	});

	it('navigates back to index page', () => {
		cy.wait('@allDeviceData');
		cy.get('[data-cy-device]').first().click();
		cy.wait(3000);
		cy.get('[data-cy-main-navbar]').get('a').first().click();
		cy.wait(3000);
		cy.url().should('equal', 'http://localhost:3000/');
	});
});
