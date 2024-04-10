import { PropsWithChildren } from 'react';

export default function Overlay({ children, className = '' }: PropsWithChildren<Props>) {
	const classStr = `z-10 bg-black op bg-opacity-40 absolute top-0 left-0 w-full h-full flex justify-center items-center ${className}`;
	return (
		<div data-cy-overlay className={classStr}>
			{children}
		</div>
	);
}
interface Props {
	className?: string;
}
