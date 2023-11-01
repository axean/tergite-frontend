'use client';
import { PropsWithChildren } from 'react';

export default function ContentSection({ children }: PropsWithChildren<Props>) {
	return (
		<div className='grid grid-cols-2 gap-2 text-md py-5 px-7 border-b border-west-coast-300'>
			{children}
		</div>
	);
}

export interface Props {}
