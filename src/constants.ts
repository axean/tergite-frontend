/**
 * Some constants usable across the app
 */

import { Tergite } from './types';

export const homeHeroText =
	'WACQT is a national research programme, coordinated from Chalmers, that aims to take Swedish research and industry to the forefront of quantum technology. Our main project is to develop a high-end quantum computer that can solve problems far beyond the reach of the best conventional supercomputers.';

export const homeMainContent =
	'The world is on the verge of a quantum technology revolution, with extremely powerful computers, intercept-proof communications and hyper-sensitive measuring instruments in sight. Wallenberg Centre for Quantum Technology is a 12 year SEK 1 billion research effort that aims to take Sweden to the forefront of this very rapidly expanding area of technology. Through an extensive research programme, we aim at developing and securing Swedish expertise within the main areas of quantum technology: quantum computing and simulation, quantum communications and quantum sensing. Our main project is to develop a quantum computer that can solve problems far beyond the reach of the best conventional supercomputers.';

export const serviceLinks: Tergite.ServiceLinkInfo[] = [
	{ href: '/webgui', text: 'GUI' },
	{ href: '/mss', text: 'API' }
];

export const oauth2Providers: Tergite.Oauth2ProviderInfo[] = [
	{ name: 'github', logo: 'img/Github_Logo.png' },
	{ name: 'puhuri' },
	{ name: 'chalmers', logo: '/img/chalmers.26fdad12.svg' }
];
