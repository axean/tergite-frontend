import NextLink from 'next/link';
import { useMemo } from 'react';
import Image from 'next/image';

export default function Oauth2LoginBtn({ provider, logo }: Props) {
	const href = useMemo(() => `/api/login/${provider}`, [provider]);
	const label = useMemo(() => `Login with ${provider}`, [provider]);
	return (
		<NextLink href={href} passHref legacyBehavior className='block'>
			<div className='grid grid-cols-3 h-20 w-96 cursor-pointer bg-white hover:bg-west-coast font-semibold hover:text-white py-2 px-7 border border-west-coast-300 hover:border-transparent rounded gap-2'>
				<span className='h-full col-span-2 capitalize flex items-center border-r border-west-coast-300'>
					{label}
				</span>
				{logo && (
					<div style={{ width: '100%', height: '100%', position: 'relative' }}>
						<Image
							alt={provider}
							loading='lazy'
							layout='fill'
							objectFit='contain'
							style={{ color: 'transparent' }}
							src={logo}
						/>
					</div>
				)}
			</div>
		</NextLink>
	);
}

interface Props {
	logo?: string;
	provider: string;
}
