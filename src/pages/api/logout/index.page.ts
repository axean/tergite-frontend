import { logout, readToml } from '@/utils/server';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<API.StatusMessage | { detail: string }>
) {
	if (req.method !== 'POST') {
		res.status(405).json({ detail: 'METHOD NOT ALLOWED' });
		return;
	}
	const oauthConfigFile = process.env.AUTH_CONFIG_FILE || 'auth_config.toml';
	const oauthConfig = await readToml(oauthConfigFile);

	const generalConfig = oauthConfig.general || {};
	const cookieName = generalConfig.cookie_name;
	logout(req, res, cookieName);

	res.status(200).json({ message: 'LOGGED OUT' });
}
