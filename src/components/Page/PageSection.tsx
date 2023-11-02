import { PropsWithChildren } from 'react';

export function PageSection({ children, title }: PropsWithChildren<Props>) {
	return (
		<div data-cy-project-section={title} className='text-md py-5 px-7'>
			<p className='font-semibold'>{title}</p>
			{children}
		</div>
	);
}

interface Props {
	title: string;
}
