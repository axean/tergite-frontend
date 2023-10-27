import { PropsWithChildren } from 'react';
export { CardBtn } from './CardBtn';
export { CardFooter } from './CardFooter';
export { CardHeader } from './CardHeader';

export default function Card({ children, className = '' }: PropsWithChildren<Props>) {
	return (
		<div className={`bg-white  border border-west-coast-300 rounded ${className}`}>
			{children}
		</div>
	);
}

interface Props {
	className?: string;
}
