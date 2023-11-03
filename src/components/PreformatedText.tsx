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
			className={`flex justify-between divide-x divide-slate-400 bg-slate-200 border border-slate-500 rounded-md pl-4 ${className}`}
		>
			<div data-cy-token-display className='text-md py-5 w-fit whitespace-pre '>
				{text}
			</div>
			<button
				type='button'
				data-cy-copy-btn
				className='p-2 rounded-r-md text-sm bg-white hover:bg-west-coast hover:text-white active:bg-slate-200 active:text-black'
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
