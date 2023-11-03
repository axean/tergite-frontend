import { NextResponse } from 'next/server';
import { API } from '@/types';

/**
 * Returns the basic configuration of the application for the client to use
 * @param request - the HTTP request
 * @returns the config for client-side only components to access some process env variables
 */
export async function GET(request: Request) {
	const baseUrl = process.env.API_BASE_URL || '';
	return NextResponse.json({ baseUrl } as API.Config);
}
