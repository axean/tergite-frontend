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
	const serviceLinks: API.ServiceLinkInfo[] = [
		{ href: process.env.WEBGUI_ENDPOINT || '/webgui', text: 'GUI' },
		{ href: process.env.MSS_ENDPOINT || '/mss', text: 'API' }
	];

	return NextResponse.json({ baseUrl, serviceLinks } as API.Config);
}
