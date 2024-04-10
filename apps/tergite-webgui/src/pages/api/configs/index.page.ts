import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse<API.Response.Configs | { detail: string }>
) {
	try {
		const result: API.Response.Configs = {
			mssBaseUrl: process.env.API_BASE_URL as string,
			landingPageUrl: process.env.LANDING_ENDPOINT as string,
			webguiBaseUrl: process.env.WEBGUI_ENDPOINT as string,
			correctMLExperimentID: process.env.CORRECT_ML_EXPERIMENT_ID as string
		};
		res.status(200).json(result);
	} catch (err) {
		console.error(err);
		res.status(500).json({ detail: 'failed to return data' });
	}
}
