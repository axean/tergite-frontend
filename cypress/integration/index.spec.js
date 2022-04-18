describe('index page', () => {
	beforeEach(() => {
		cy.intercept('GET', 'http://qtl-webgui-2.mc2.chalmers.se:8080/devices/', {
			fixture: 'devices.json'
		});
	});
	it('does stuff', () => {
		cy.visit('/');
	});
});
