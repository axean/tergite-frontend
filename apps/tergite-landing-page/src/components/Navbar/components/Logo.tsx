import React from 'react';
import NextLink from 'next/link';
import Image from 'next/image';
import chalmersLogo from '@/images/chalmers-logo.svg';

export default function Logo({}: Props) {
	return (
		<NextLink
			aria-label='To frontpage'
			className='group transition focus:underline lg:hover:underline focus:bg-west-coast focus:text-white outline-none group flex p-4 pr-0 xs:pr-4'
			href='/'
		>
			<Image
				data-cy-logo-img
				alt='Chalmers logo'
				loading='lazy'
				width='135'
				height='18'
				decoding='async'
				data-nimg='1'
				className='group-focus:invert'
				style={{ color: 'transparent' }}
				src={chalmersLogo}
			/>
		</NextLink>
	);
}

interface Props {}
