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
	const mssConfigFile = process.env.MSS_CONFIG_FILE || 'mss-config.toml';
	const mssConfig = await readToml(mssConfigFile);

	const authConfig = mssConfig.auth || {};
	const cookieName = authConfig.cookie_name;
	logout(req, res, cookieName);

	res.status(200).json({ message: 'LOGGED OUT' });
}
