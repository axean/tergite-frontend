import { MouseEventHandler } from 'react';

export function CardBtn({ label, onClick, disabled, className = '' }: Props) {
	return (
		<button
			className={`rounded py-2 px-7 font-semibold text-lg border hover:border-transparent disabled:border-transparent ${className}`}
			disabled={disabled}
			onClick={onClick}
		>
			{label}
		</button>
	);
}

interface Props {
	disabled: boolean;
	onClick: MouseEventHandler<HTMLButtonElement>;
	label: string;
	className?: string;
}

