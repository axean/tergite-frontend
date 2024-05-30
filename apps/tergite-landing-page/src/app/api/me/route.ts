import { getAccessToken } from '@/service/server';
import { NextResponse } from 'next/server';
import { API } from '@/types';
import { errors } from '@/constants';
import { readToml, verifyJwtToken } from '../../../../utils';

// ensure this is not reduced to compile-time variables
// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
	const mssConfigFile = process.env.MSS_CONFIG_FILE || 'mss-config.toml';
	const mssConfig = await readToml(mssConfigFile);

	const authConfig = mssConfig.auth || {};
	const cookieName = authConfig.cookie_name;
	const token = getAccessToken(cookieName);

	try {
		const result = token && (await verifyJwtToken(token, mssConfig));
		const resp =
			result && ({ id: result.payload.sub, roles: result.payload.roles } as API.User);
		return NextResponse.json(resp);
	} catch (error) {
		const detail = errors.UNAUTHENTICATED;
		return NextResponse.json({ detail }, { status: 403 });
	}
}
