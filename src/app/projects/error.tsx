'use client'; // Error components must be Client Components

import Card, { CardBtn, CardFooter, CardHeader } from '@/components/Card';
import ErrorText from '@/components/ErrorText';
import Page from '@/components/Page';
import type { API } from '@/types';
import { useEffect } from 'react';

export default function Error({
	error,
	reset
}: {
	error: API.EnhancedError & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	const isUnauthorized = [401, 403].includes(error.status as number);
	console.log({ error });
	const errorMessage =
		typeof error.message === 'object' ? JSON.stringify(error.message) : error.message;

	const message = isUnauthorized ? 'Not Found' : `${errorMessage}`;

	return (
		<Page className='h-full w-full flex flex-1 justify-center items-center'>
			<Card>
				<CardHeader title='Oops!' />
				<ErrorText text={message} className='text-center font-semibold py-10 px-5' />
				{!isUnauthorized && (
					<CardFooter className='flex justify-center'>
						<CardBtn
							label='Try Again'
							disabled={isUnauthorized}
							onClick={() => reset()}
							className='rounded bg-west-coast text-white py-2 px-7 hover:bg-west-coast font-semibold hover:text-white  border border-west-coast-300 hover:border-transparent'
						/>
					</CardFooter>
				)}
			</Card>
		</Page>
	);
}
