import { logout } from '@/service/server';
import { API } from '@/types';
import { NextResponse } from 'next/server';
import { readToml } from '../../../../utils';

// ensure this is not reduced to compile-time variables
// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
	const oauthConfigFile = process.env.AUTH_CONFIG_FILE || 'auth_config.toml';
	const oauthConfig = await readToml(oauthConfigFile);

	const generalConfig = oauthConfig.general || {};
	const cookieName = generalConfig.cookie_name;
	logout(cookieName);
	const resp = { message: 'LOGGED OUT' } as API.StatusMessage;
	return NextResponse.json(resp);
}
