import { MouseEventHandler } from 'react';
import Spinner from '../Spinner';

export function HeaderBtn({
	text,
	onClick,
	disabled = false,
	isLoading = false,
	type = 'button'
}: Props) {
	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled}
			data-cy-header-btn={text}
			className='rounded bg-west-coast text-center text-white py-2 px-7 hover:bg-west-coast font-semibold hover:text-white  border border-west-coast-300 hover:border-transparent'
		>
			{isLoading ? <Spinner /> : text}
		</button>
	);
}

interface Props {
	type?: 'button' | 'submit' | 'reset';
	text: string;
	disabled?: boolean;
	isLoading?: boolean;
	onClick: MouseEventHandler<HTMLButtonElement>;
}
