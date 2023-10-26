import { PropsWithChildren } from 'react';

export default function PageHeader({ heading, children }: PropsWithChildren<Props>) {
	return (
		<section className='flex mb-20 justify-between'>
			<h2 className='font-bold text-3xl'>{heading}</h2>
			{children}
		</section>
	);
}

interface Props {
	heading: string;
}

