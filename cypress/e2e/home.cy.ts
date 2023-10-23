import meResponses from '../fixtures/meResponses.json';
import { API } from '../../src/types';
import utils from './utils';

meResponses.forEach((resp) => {
	utils.loadEnv();
	const isNoAuth = resp.statusCode == 403;
	const user = resp.body as API.User;
	const id = user.id ?? 'anonymous';
	const isAdmin = user.roles?.includes(API.UserRole.ADMIN);
	const isNormalUser = isAdmin === false;

	describe(`home page for user '${id}'`, () => {
		beforeEach(() => {
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

			cy.get('[data-cy-nav-item]').as('navItems');
			cy.get('[data-cy-app-button]').as('appBtns');
			!isNoAuth && cy.get('[data-cy-nav-btn]').as('logoutBtn');
		});

		isNoAuth &&
			it('renders no-auth navbar', () => {
				cy.get('[data-cy-site-actions-navbar]').within(() => {
					cy.get('[data-cy-logo-img]').should(
						'have.attr',
						'src',
						'/img/chalmers.26fdad12.svg'
					);

					cy.get('@navItems').should('have.length', 2);

					cy.get('@navItems')
						.eq(0)
						.should('contain.text', 'Home')
						.should('have.attr', 'href', '/');

					cy.get('@navItems')
						.eq(1)
						.should('contain.text', 'Login')
						.should('have.attr', 'href', '/login');
				});
			});

		isAdmin &&
			it('renders admin navbar for admins', () => {
				cy.get('[data-cy-site-actions-navbar]').within(() => {
					cy.get('[data-cy-logo-img]').should(
						'have.attr',
						'src',
						'/img/chalmers.26fdad12.svg'
					);

					cy.get('@navItems').should('have.length', 3);

					cy.get('@navItems')
						.eq(0)
						.should('contain.text', 'Home')
						.should('have.attr', 'href', '/');

					cy.get('@navItems')
						.eq(1)
						.should('contain.text', 'Projects')
						.should('have.attr', 'href', '/projects');

					cy.get('@navItems')
						.eq(2)
						.should('contain.text', 'App tokens')
						.should('have.attr', 'href', '/app-tokens');

					cy.get('@logoutBtn').should('contain.text', 'Logout');
				});
			});

		isNormalUser &&
			it('renders non-admin navbar for non-admins', () => {
				cy.get('[data-cy-site-actions-navbar]').within(() => {
					cy.get('[data-cy-logo-img]').should(
						'have.attr',
						'src',
						'/img/chalmers.26fdad12.svg'
					);

					cy.get('@navItems').should('have.length', 2);

					cy.get('@navItems')
						.eq(0)
						.should('contain.text', 'Home')
						.should('have.attr', 'href', '/');

					cy.get('@navItems')
						.eq(1)
						.should('contain.text', 'App tokens')
						.should('have.attr', 'href', '/app-tokens');

					cy.get('@logoutBtn').should('contain.text', 'Logout');
				});
			});

		it('Home nav-item redirects to home page', () => {
			cy.get('[data-cy-site-actions-navbar]').within(() => {
				cy.get('@navItems').eq(0).click();
				cy.url().should('eq', 'http://localhost:3000/');
			});
		});

		isNoAuth &&
			it('Login nav-item directs to login page', () => {
				cy.get('[data-cy-site-actions-navbar]').within(() => {
					cy.get('@navItems').eq(1).click();
					cy.url().should('eq', 'http://localhost:3000/login');
				});
			});

		isAdmin &&
			it('Projects nav-item directs to projects page', () => {
				cy.get('[data-cy-site-actions-navbar]').within(() => {
					cy.get('@navItems').eq(1).click();
					cy.url().should('eq', 'http://localhost:3000/projects');
				});
			});

		!isNoAuth &&
			it('App-tokens nav-item directs to app-tokens page', () => {
				cy.get('[data-cy-site-actions-navbar]').within(() => {
					cy.get('@navItems').eq(-1).click();
					cy.url().should('eq', 'http://localhost:3000/app-tokens');
				});
			});

		!isNoAuth &&
			it('Logout nav-btn logs out user', () => {
				cy.get('[data-cy-site-actions-navbar]').within(() => {
					cy.get('@logoutBtn').click();
					cy.url().should('eq', 'http://localhost:3000/');

					cy.get('@navItems').should('have.length', 2);

					cy.get('@navItems')
						.eq(0)
						.should('contain.text', 'Home')
						.should('have.attr', 'href', '/');

					cy.get('@navItems')
						.eq(1)
						.should('contain.text', 'Login')
						.should('have.attr', 'href', '/login');
				});
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
			cy.get('@appBtns').should('have.length', 2);

			cy.get('@appBtns')
				.eq(0)
				.should('contain', 'GUI')
				.should('have.attr', 'href', '/webgui');

			cy.get('@appBtns').eq(1).should('contain', 'API').should('have.attr', 'href', '/mss');
		});

		it('App button `GUI` redirects to /webgui', () => {
			cy.get('@appBtns').eq(0).click();
			cy.url().should('eq', 'http://localhost:3000/webgui');
		});

		it('App button `API` redirects to /mss', () => {
			cy.get('@appBtns').eq(1).click();
			cy.url().should('eq', 'http://localhost:3000/mss');
		});

		it('renders footer', () => {
			cy.get('[data-cy-footer]')
				.find('img')
				.should('have.attr', 'src', '/img/logo.81582248.svg');
		});
	});
});
