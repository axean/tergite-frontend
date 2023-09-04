describe('home page', () => {
	beforeEach(() => {
		cy.visit('http://localhost:3000');
	});

	it('renders navbar', () => {
		cy.get('[data-cy-site-actions-navbar]')
			.find('img')
			.should('have.attr', 'src', '/img/chalmers.26fdad12.svg');
	});

	it('renders hero', () => {
		cy.get('[data-cy-hero]')
			.first()
			.within(() => {
				cy.get('img').should('have.attr', 'src', '/img/hero.webp');
				cy.get('[data-cy-hero-title]').should(
					'contain',
					'Wallenberg Center for Quantum Technology'
				);
				cy.get('[data-cy-hero-subtitle]').should('contain', 'WACQT');
				cy.get('[data-cy-hero-text]').should(
					'contain',
					'WACQT is a national research programme, coordinated from Chalmers, that aims to take Swedish research and industry to the forefront of quantum technology. Our main project is to develop a high-end quantum computer that can solve problems far beyond the reach of the best conventional supercomputers.'
				);
			});
	});

	it('renders main content', () => {
		cy.get('[data-cy-main-content]')
			.find('p')
			.should(
				'contain',
				'The world is on the verge of a quantum technology revolution, with extremely powerful computers, intercept-proof communications and hyper-sensitive measuring instruments in sight. Wallenberg Centre for Quantum Technology is a 12 year SEK 1 billion research effort that aims to take Sweden to the forefront of this very rapidly expanding area of technology. Through an extensive research programme, we aim at developing and securing Swedish expertise within the main areas of quantum technology: quantum computing and simulation, quantum communications and quantum sensing. Our main project is to develop a quantum computer that can solve problems far beyond the reach of the best conventional supercomputers.'
			);
	});

	it('renders app buttons', () => {
		cy.get('[data-cy-app-button]')
			.first()
			.should('contain', 'GUI')
			.should('have.attr', 'href', '/webgui')
			.next()
			.should('contain', 'API')
			.should('have.attr', 'href', '/mss');
	});

	it('renders footer', () => {
		cy.get('[data-cy-footer]').find('img').should('have.attr', 'src', '/img/logo.81582248.svg');
	});
});

