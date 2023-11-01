import { ChangeEventHandler, HTMLInputTypeAttribute } from 'react';

export function Input({
	name = '',
	type = 'text',
	disabled,
	value,
	label: text,
	placeholder = '',
	onChange,
	required = false,
	labelClassName = '',
	inputClassName = ''
}: Props) {
	const classForRequired = required ? "after:content-['*'] after:ml-0.5" : '';
	return (
		<label data-cy-input={text} className='block mb-5 px-10 py-5'>
			<span
				data-cy-label
				className={`block text-lg font-medium text-slate-700 ${classForRequired} ${labelClassName}`}
			>
				{text}
			</span>
			<input
				type={type}
				value={value}
				disabled={disabled}
				required={required}
				name={name}
				data-cy-inner-input
				className={`mt-1 px-3 py-2 bg-white disabled:bg-slate-100 disabled:text-slate-500 border shadow-sm border-slate-300 placeholder-slate-400 focus:outline-none block w-full rounded-md sm:text-md focus:ring-1 ${inputClassName}`}
				placeholder={placeholder}
				onChange={onChange}
			/>
		</label>
	);
}
interface Props {
	name?: string;
	type?: HTMLInputTypeAttribute;
	disabled?: boolean;
	value?: string | number;
	label: string;
	placeholder?: string;
	onChange: ChangeEventHandler<HTMLInputElement>;
	required?: boolean;
	labelClassName?: string;
	inputClassName?: string;
}
