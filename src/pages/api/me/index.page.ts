import { getAccessToken, readToml, verifyJwtToken } from '@/utils/server';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<API.User | { detail: string }>
) {
	if (req.method !== 'GET') {
		res.status(405).json({ detail: 'METHOD NOT ALLOWED' });
		return;
	}

	const oauthConfigFile = process.env.AUTH_CONFIG_FILE || 'auth_config.toml';
	const oauthConfig = await readToml(oauthConfigFile);

	const generalConfig = oauthConfig.general || {};
	const cookieName = generalConfig.cookie_name;
	const token = getAccessToken(req, cookieName);
	try {
		const result = token && (await verifyJwtToken(token, oauthConfig));
		const resp =
			result && ({ id: result.payload.sub, roles: result.payload.roles } as API.User);
		if (!resp) {
			throw new Error(`token verification result is ${resp}`);
		}

		res.status(200).json(resp);
	} catch (err) {
		res.status(403).json({ detail: 'UNAUTHENTICATED' });
	}
}
