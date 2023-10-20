import React from 'react';
import NextLink from 'next/link';
import Image from 'next/image';

export default function Logo({ src }: Props) {
	return (
		<NextLink
			aria-label='To frontpage'
			className='group transition focus:underline lg:hover:underline focus:bg-west-coast focus:text-white outline-none group flex p-4 pr-0 xs:pr-4'
			href='/'
		>
			<Image
				alt='Chalmers logo'
				loading='lazy'
				width='135'
				height='18'
				decoding='async'
				data-nimg='1'
				className='group-focus:invert'
				style={{ color: 'transparent' }}
				src={src}
			/>
		</NextLink>
	);
}

interface Props {
	src: string;
}
