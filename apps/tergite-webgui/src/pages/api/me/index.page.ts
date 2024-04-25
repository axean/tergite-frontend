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

	const mssConfigFile = process.env.CONFIG_FILE || 'config.toml';
	const mssConfig = await readToml(mssConfigFile);

	const authConfig = mssConfig.auth || {};
	const cookieName = authConfig.cookie_name;
	const token = getAccessToken(req, cookieName);
	try {
		const result = token && (await verifyJwtToken(token, mssConfig));
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
