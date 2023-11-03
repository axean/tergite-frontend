'use client';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { homeHeroText, homeMainContent, serviceLinks } from '../../constants';
import Hero from './components/Hero';
import MainSection from './components/MainSection';
import Page from '@/components/Page';

export default function Home() {
	return (
		<>
			<Navbar />
			<Page className='w-full'>
				<Hero
					title='Wallenberg Center for Quantum Technology'
					subtitle='WACQT'
					text={homeHeroText}
					imgSrc='/img/hero.webp'
					imgAlt='Quatum computer.'
				/>
				<MainSection text={homeMainContent} services={serviceLinks} />
			</Page>
			<Footer />
		</>
	);
}

export async function getStaticProps() {
	// `getStaticProps` is executed on the server side.
	return {
		props: {
			fallback: {
				'/api/me': null
			}
		}
	};
}
