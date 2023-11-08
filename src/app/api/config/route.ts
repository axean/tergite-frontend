import { NextResponse } from 'next/server';
import type { API } from '@/types';

// ensure this is not reduced to compile-time variables
// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
export const dynamic = 'force-dynamic';

/**
 * Returns the basic configuration of the application for the client to use
 * @param request - the HTTP request
 * @returns the config for client-side only components to access some process env variables
 */
export async function GET(request: Request) {
	const baseUrl = process.env.API_BASE_URL || '';
	const appBaseUrl = process.env.LANDING_ENDPOINT;

	// FIXME: In future, these configurations could be even got from a redis instance
	// or MSS or whatever
	const serviceLinks: API.ServiceLinkInfo[] = [
		{ href: process.env.WEBGUI_ENDPOINT || '/webgui', text: 'GUI' },
		{ href: process.env.MSS_ENDPOINT || '/mss', text: 'API' }
	];
	// when compiled, width and height are essential; when in dev, chaos arises with both fill and width on Image
	const extraProps = process.env.NODE_ENV === 'production' ? { height: 410, width: 1000 } : {};

	const oauth2Providers: API.Oauth2ProviderInfo[] = [
		{
			name: 'github',
			logo: { src: `${appBaseUrl}/img/github-black.png`, ...extraProps }
		},
		{ name: 'puhuri' },
		{
			name: 'chalmers',
			logo: { src: `${appBaseUrl}/img/chalmers-logo.svg`, ...extraProps }
		}
	];

	return NextResponse.json({ baseUrl, serviceLinks, oauth2Providers } as API.Config);
}
