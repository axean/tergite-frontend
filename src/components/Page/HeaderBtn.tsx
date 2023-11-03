import { MouseEventHandler } from 'react';

export function HeaderBtn({ text, onClick, disabled = false, type = 'button' }: Props) {
	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled}
			data-cy-header-btn
			className='rounded bg-west-coast text-white py-2 px-7 hover:bg-west-coast font-semibold hover:text-white  border border-west-coast-300 hover:border-transparent'
		>
			{text}
		</button>
	);
}

interface Props {
	type?: 'button' | 'submit' | 'reset';
	text: string;
	disabled?: boolean;
	onClick: MouseEventHandler<HTMLButtonElement>;
}
