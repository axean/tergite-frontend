import { getAccessToken } from '@/service/server';
import { NextResponse } from 'next/server';

/**
 * Retrieves the list of projects
 *
 * @param request - the request object
 * @returns - a list of projects if successful or an error message
 */
export async function GET(request: Request) {
	const token = getAccessToken();
	const baseUrl = process.env.API_BASE_URL || '';

	const originalUrl = request.url;
	const queryString = originalUrl.split('?')[1] || '';
	const url = `${baseUrl}/auth/projects?${queryString}`;
	const headers = {
		Authorization: `Bearer ${token}`
	};

	try {
		return await fetch(url, { headers });
	} catch (error) {
		console.error(error);
		return NextResponse.json({ detail: 'unexpected error' });
	}
}
