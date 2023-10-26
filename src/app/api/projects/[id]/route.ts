import { getAccessToken } from '@/service/server';
import { NextResponse } from 'next/server';

/**
 * Deletes the given project
 *
 * @param request - the request object
 * @returns - a list of projects if successful or an error message
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
	const id = params.id;
	const token = getAccessToken();
	const baseUrl = process.env.API_BASE_URL || '';

	const url = `${baseUrl}/auth/projects/${id}`;
	const headers = {
		Authorization: `Bearer ${token}`
	};

	try {
		return await fetch(url, { headers, method: 'DELETE', cache: 'no-cache' });
	} catch (error) {
		console.error(error);
		return NextResponse.json({ detail: 'unexpected error' });
	}
}

/**
 * Gets the given project
 *
 * @param request - the request object
 * @returns - a list of projects if successful or an error message
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
	const id = params.id;
	const token = getAccessToken();
	const baseUrl = process.env.API_BASE_URL || '';

	const url = `${baseUrl}/auth/projects/${id}`;
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
