import meResponses from '../fixtures/meResponses.json';
import { API } from '../../src/types';
import utils from '../../utils';
import { testNavigation } from './navigation';

testNavigation('http://localhost:3000');

meResponses.forEach((resp) => {
	const user = resp.body as API.User;
	const id = user.id ?? 'anonymous';

	describe(`home page for user '${id}'`, () => {
		before(() => {
			cy.readFile('./.env.test', 'utf-8').then((str) => utils.loadEnvFromString(str));
		});

		beforeEach(() => {
			cy.intercept('GET', '/api/config').as('configRequest');

			if (user.id) {
				cy.wrap(utils.generateJwt(user)).then((jwtToken) => {
					const cookieName = process.env.COOKIE_NAME as string;
					const domain = process.env.COOKIE_DOMAIN as string;

					cy.setCookie(cookieName, jwtToken as string, {
						domain,
						httpOnly: true,
						secure: false,
						sameSite: 'lax'
					});
				});
			}

			cy.visit('http://localhost:3000');

			cy.wait('@configRequest');
		});

		// it('renders hero', () => {
		// 	cy.get('[data-cy-hero]')
		// 		.first()
		// 		.within(() => {
		// 			cy.get('img').should('have.attr', 'src', '/img/hero.webp');
		// 			cy.get('[data-cy-hero-title]').should(
		// 				'contain',
		// 				'Wallenberg Center for Quantum Technology'
		// 			);
		// 			cy.get('[data-cy-hero-subtitle]').should('contain', 'WACQT');
		// 			cy.get('[data-cy-hero-text]').should(
		// 				'contain',
		// 				'WACQT is a national research programme, coordinated from Chalmers, that aims to take Swedish research and industry to the forefront of quantum technology. Our main project is to develop a high-end quantum computer that can solve problems far beyond the reach of the best conventional supercomputers.'
		// 			);
		// 		});
		// });

		// it('renders main content', () => {
		// 	cy.get('[data-cy-main-content]')
		// 		.find('p')
		// 		.should(
		// 			'contain',
		// 			'The world is on the verge of a quantum technology revolution, with extremely powerful computers, intercept-proof communications and hyper-sensitive measuring instruments in sight. Wallenberg Centre for Quantum Technology is a 12 year SEK 1 billion research effort that aims to take Sweden to the forefront of this very rapidly expanding area of technology. Through an extensive research programme, we aim at developing and securing Swedish expertise within the main areas of quantum technology: quantum computing and simulation, quantum communications and quantum sensing. Our main project is to develop a quantum computer that can solve problems far beyond the reach of the best conventional supercomputers.'
		// 		);
		// });

		it('renders app buttons', () => {
			cy.get('[data-cy-app-button]').as('appBtns');
			cy.get('@appBtns').should('have.length', 2);

			cy.get('@appBtns')
				.eq(0)
				.should('contain', 'GUI')
				.should('have.attr', 'href', process.env.WEBGUI_ENDPOINT);

			cy.get('@appBtns')
				.eq(1)
				.should('contain', 'API')
				.should('have.attr', 'href', process.env.MSS_ENDPOINT);
		});

		it('App button `GUI` redirects to webgui process.env.WEBGUI_ENDPOINT', () => {
			cy.get('[data-cy-app-button="GUI"]').click();
			cy.url().should('eq', process.env.WEBGUI_ENDPOINT);
		});

		it('App button `API` redirects to process.env.MSS_ENDPOINT', () => {
			cy.get('[data-cy-app-button="API"]').click();
			cy.url().should('eq', process.env.MSS_ENDPOINT);
		});
	});
});
