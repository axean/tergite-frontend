import { ChangeEventHandler } from 'react';

export default function TextInput({
	label: text,
	placeholder = '',
	onChange,
	required = false,
	labelClassName = '',
	inputClassName = ''
}: Props) {
	const classForRequired = required ? "after:content-['*'] after:ml-0.5" : '';
	return (
		<label className='block mb-5 px-10 py-5'>
			<span
				className={`block text-lg font-medium text-slate-700 ${classForRequired} ${labelClassName}`}
			>
				{text}
			</span>
			<input
				type='text'
				className={`mt-1 px-3 py-2 bg-white border shadow-sm border-slate-300 placeholder-slate-400 focus:outline-none block w-full rounded-md sm:text-md focus:ring-1 ${inputClassName}`}
				placeholder={placeholder}
				onChange={onChange}
			/>
		</label>
	);
}
interface Props {
	label: string;
	placeholder?: string;
	onChange: ChangeEventHandler<HTMLInputElement>;
	required?: boolean;
	labelClassName?: string;
	inputClassName?: string;
}

