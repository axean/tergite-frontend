import { MouseEvent, useCallback } from 'react';

export default function PreformatedText({ text, className = '' }: Props) {
	const handleCopyBtnClick = useCallback(
		(ev: MouseEvent<HTMLButtonElement>) => {
			ev.preventDefault();
			navigator.clipboard.writeText(text);
		},
		[text]
	);

	return (
		<div
			className={`flex divide-x divide-slate-300 bg-slate-200 border border-slate-500 rounded-md ${className}`}
		>
			<div data-cy-token-display className='text-md py-5 w-fit whitespace-pre '>
				{text}
			</div>
			<button
				type='button'
				data-cy-copy-btn
				className='p-2 rounded-r-md text-sm hover:bg-west-coast hover:text-white'
				onClick={handleCopyBtnClick}
			>
				copy
			</button>
		</div>
	);
}

interface Props {
	text: string;
	className?: string;
}
