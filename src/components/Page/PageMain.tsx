import { PropsWithChildren } from 'react';

export default function PageMain({ children, className = '' }: PropsWithChildren<Props>) {
	return (
		<section className={`bg-slate-50 w-full border border-west-coast-300 rounded ${className}`}>
			{children}
		</section>
	);
}

interface Props {
	className?: string;
}

