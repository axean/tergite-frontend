import { API } from '@/types';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { provider: string } }) {
	const provider = params.provider;
	const host = request.headers.get('host');
	const redirectUrl = process.env.OAUTH_REDIRECT_URI || `http://${host}`;
	const nextUrl = encodeURI(redirectUrl);
	const authorizeUrl = `${process.env.API_BASE_URL}/auth/app/${provider}/authorize?next=${nextUrl}`;

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
