import { getAccessToken } from '@/service/server';
import { NextResponse } from 'next/server';
import { API } from '@/types';
import { errors } from '@/constants';
import { verifyJwtToken } from '../../../../utils';

export async function GET(request: Request) {
	const token = getAccessToken();

	try {
		const result = token && (await verifyJwtToken(token));
		const resp =
			result && ({ id: result.payload.sub, roles: result.payload.roles } as API.User);
		return NextResponse.json(resp);
	} catch (error) {
		const detail = errors.UNAUTHENTICATED;
		return NextResponse.json({ detail }, { status: 403 });
	}
}
