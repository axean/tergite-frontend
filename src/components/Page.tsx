import { PropsWithChildren } from 'react';

export default function Page({ className = '', children }: PropsWithChildren<Props>) {
	return (
		<div data-cy-content className={className}>
			{children}
		</div>
	);
}

interface Props {
	className?: string;
}
