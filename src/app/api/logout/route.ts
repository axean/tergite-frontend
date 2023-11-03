import { logout } from '@/service/server';
import { API } from '@/types';
import { NextResponse } from 'next/server';

// ensure this is not reduced to compile-time variables
// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
	logout();
	const resp = { message: 'LOGGED OUT' } as API.StatusMessage;
	return NextResponse.json(resp);
}
