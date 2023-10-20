import { logout } from '@/service/server';
import { API } from '@/types';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
	logout();
	const resp = { message: 'LOGGED OUT' } as API.StatusMessage;
	return NextResponse.json(resp);
}
