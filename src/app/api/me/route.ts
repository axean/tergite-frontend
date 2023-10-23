import { jwtVerify } from 'jose';
import { getAccessToken } from '@/service/server';
import { NextResponse } from 'next/server';
import { API } from '@/types';
import { errors } from '@/constants';

export async function GET(request: Request) {
	const token = getAccessToken();
	const jwtSecret = process.env.JWT_SECRET || '';
	const audience = process.env.JWT_AUDIENCE || 'fastapi-users:auth';
	const jwtAlgorithm = process.env.JWT_ALGORITHM || 'HS256';
	const algorithms = [jwtAlgorithm];
	const secret = new TextEncoder().encode(jwtSecret);

	try {
		const result = token && (await jwtVerify(token, secret, { audience, algorithms }));
		const resp =
			result && ({ id: result.payload.sub, roles: result.payload.roles } as API.User);
		return NextResponse.json(resp);
	} catch (error) {
		const detail = errors.UNAUTHENTICATED;
		return NextResponse.json({ detail }, { status: 403 });
	}
}
