import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import { getAccessToken } from '@/app/service';

const jwtVerify = promisify<string, jwt.Secret, jwt.VerifyOptions, jwt.JwtPayload>(jwt.verify);

export async function GET(request: Request) {
	const token = getAccessToken();
	const jwtSecret = process.env.JWT_SECRET || '';
	const audience = process.env.JWT_AUDIENCE || 'fastapi-users:auth';
	const jwtAlgorithm = process.env.JWT_ALGORITHM || 'HS256';
	const algorithms = [jwtAlgorithm as jwt.Algorithm];

	try {
		const payload = token && (await jwtVerify(token, jwtSecret, { audience, algorithms }));
        const resp = payload && ({ id: payload.sub, roles: payload.roles } as API.User)
		return Response.json(resp);
	} catch (error) {
		const detail = 'invalid access token';
		console.error(detail, error);
		return Response.json({ detail }, { status: 403 });
	}
}

