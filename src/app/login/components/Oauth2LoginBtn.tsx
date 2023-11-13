import NextLink from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { API } from '@/types';
import Spinner from '@/components/Spinner';

export default function Oauth2LoginBtn({ provider, logo, nextUrl = '' }: Props) {
	const [isLoading, setIsLoading] = useState(false);
	const queryString = useMemo(() => nextUrl && `?next=${nextUrl}`, [nextUrl]);
	const href = useMemo(() => `/api/login/${provider}${queryString}`, [provider, queryString]);
	const label = useMemo(() => `Login with ${provider}`, [provider]);
	const colorClass = useMemo(
		() => (isLoading ? 'bg-west-coast-400 text-white' : 'bg-white'),
		[isLoading]
	);

	const handleClick = useCallback(() => setIsLoading(true), [setIsLoading]);

	useEffect(() => {
		return () => setIsLoading(false);
	}, [setIsLoading]);

	return (
		<NextLink href={href} passHref legacyBehavior className='block'>
			<div
				onClick={handleClick}
				data-cy-login-with={provider}
				className={`grid grid-cols-3 h-20 w-96 cursor-pointer ${colorClass}  hover:bg-west-coast font-semibold hover:text-white py-2 px-7 border border-west-coast-300 hover:border-transparent rounded gap-2`}
			>
				<span className='h-full col-span-2 capitalize flex items-center border-r border-west-coast-300'>
					{label}
				</span>
				{isLoading && <Spinner className='w-full h-full p-4' />}
				{logo && !isLoading && (
					<div style={{ width: '100%', height: '100%', position: 'relative' }}>
						<Image
							alt={provider}
							loading='lazy'
							fill
							sizes='100%'
							className='object-center object-contain text-transparent'
							{...logo}
						/>
					</div>
				)}
			</div>
		</NextLink>
	);
}

interface Props {
	logo?: API.ImageInfo;
	provider: string;
	nextUrl?: string;
}
