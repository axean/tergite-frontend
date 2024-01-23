import { getAccessToken } from '@/service/server';
import { NextResponse } from 'next/server';
import { API } from '@/types';
import { errors } from '@/constants';
import { readToml, verifyJwtToken } from '../../../../utils';

// ensure this is not reduced to compile-time variables
// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
	const oauthConfigFile = process.env.AUTH_CONFIG_FILE || 'auth_config.toml';
	const oauthConfig = await readToml(oauthConfigFile);

	const generalConfig = oauthConfig.general || {};
	const cookieName = generalConfig.cookie_name;
	const token = getAccessToken(cookieName);

	try {
		const result = token && (await verifyJwtToken(token, oauthConfig));
		const resp =
			result && ({ id: result.payload.sub, roles: result.payload.roles } as API.User);
		return NextResponse.json(resp);
	} catch (error) {
		const detail = errors.UNAUTHENTICATED;
		return NextResponse.json({ detail }, { status: 403 });
	}
}
