'use client';

import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { homeHeroText, homeMainContent } from '../../constants';
import Hero from './components/Hero';
import MainSection from './components/MainSection';
import Page from '@/components/Page';
import { fetcher, raise } from '@/service/browser';
import { API } from '@/types';
import useSWRImmutable from 'swr/immutable';

export default function Home() {
	const { data: config, error } = useSWRImmutable<API.Config>(`/api/config`, fetcher);
	error && raise(error);

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
				{config && <MainSection text={homeMainContent} services={config.serviceLinks} />}
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
