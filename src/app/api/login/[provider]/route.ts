import { API } from '@/types';
import { NextResponse } from 'next/server';

// ensure this is not reduced to compile-time variables
// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { provider: string } }) {
	const provider = params.provider;
	const host = request.headers.get('host');
	const redirectUrl = process.env.OAUTH_REDIRECT_URI || `http://${host}`;
	const nextUrl = encodeURI(redirectUrl);
	// issue with fetch and localhost:
	// https://github.com/vercel/next.js/issues/45315#issuecomment-1406579321
	const baseUrl = process.env.API_BASE_URL?.replace('localhost', '127.0.0.1');
	const authorizeUrl = `${baseUrl}/auth/app/${provider}/authorize?next=${nextUrl}`;

	try {
		const response = await fetch(authorizeUrl, { cache: 'no-store' });
		if (response.ok) {
			const body: API.Response.Authorize = await response.json();
			return NextResponse.redirect(body.authorization_url);
		}
		return response;
	} catch (error) {
		console.error(error);
		return NextResponse.json({ detail: 'unexpected error' });
	}
}
