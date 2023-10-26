import { PropsWithChildren } from 'react';

export function CardFooter({ children, className = '' }: PropsWithChildren<Props>) {
	return (
		<div className={`py-5 px-10 border-t border-west-coast-200 ${className}`}>{children}</div>
	);
}
interface Props {
	className?: string;
}
