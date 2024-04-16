import { NextResponse } from 'next/server';
import type { API } from '@/types';
import { readToml } from '../../../../utils';

const OAUTH2_LOGOS: { [key: string]: string } = {
	github: '/img/github-black.png',
	chalmers: '/img/chalmers-logo.svg'
};

// ensure this is not reduced to compile-time variables
// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
export const dynamic = 'force-dynamic';

/**
 * Returns the basic configuration of the application for the client to use
 * @param request - the HTTP request
 * @returns the config for client-side only components to access some process env variables
 */
export async function GET(request: Request) {
	const baseUrl = process.env.MSS_ENDPOINT || '';
	const appBaseUrl = process.env.LANDING_ENDPOINT;
	const oauthConfigFile = process.env.AUTH_CONFIG_FILE || 'auth_config.toml';

	// FIXME: In future, these configurations could be even got from a redis instance
	// or MSS or whatever
	const serviceLinks: API.ServiceLinkInfo[] = [
		{ href: process.env.WEBGUI_ENDPOINT || '/webgui', text: 'GUI' },
		{ href: process.env.MSS_ENDPOINT || '/mss', text: 'API' }
	];
	// when compiled, width and height are essential; when in dev, chaos arises with both fill and width on Image
	const extraProps = process.env.NODE_ENV === 'production' ? { height: 410, width: 1000 } : {};
	const oauthConfig = await readToml(oauthConfigFile);
	const oauthClients = oauthConfig.clients as { name: string }[];

	const oauth2Providers: API.Oauth2ProviderInfo[] = oauthClients.map((v) =>
		OAUTH2_LOGOS[v.name]
			? {
					name: v.name,
					logo: { src: `${appBaseUrl}${OAUTH2_LOGOS[v.name]}`, ...extraProps }
			  }
			: { name: v.name }
	);

	return NextResponse.json({ baseUrl, serviceLinks, oauth2Providers } as API.Config);
}
