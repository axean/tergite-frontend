import { PropsWithChildren } from 'react';

export function PageHeader({ heading, children }: PropsWithChildren<Props>) {
	return (
		<section className='flex mb-5 lg:mb-10 justify-between'>
			<h2 className='font-bold text-2xl lg:text-3xl'>{heading}</h2>
			{children}
		</section>
	);
}

interface Props {
	heading: string;
}
