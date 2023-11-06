import { MouseEventHandler } from 'react';
import Spinner from '../Spinner';

export function CardBtn({ label, onClick, disabled, className = '', isLoading = false }: Props) {
	return (
		<button
			data-cy-card-btn
			className={`rounded py-2 text-center px-7 font-semibold text-lg border hover:border-transparent disabled:border-transparent ${className}`}
			disabled={disabled}
			onClick={onClick}
		>
			{isLoading ? <Spinner /> : label}
		</button>
	);
}

interface Props {
	disabled: boolean;
	onClick: MouseEventHandler<HTMLButtonElement>;
	label: string;
	className?: string;
	isLoading?: boolean;
}
