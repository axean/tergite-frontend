import { ChangeEvent, MouseEvent, useCallback, useState } from 'react';

export function MultiTextInput({
	name = '',
	label: text,
	placeholder = '',
	onChange,
	required = false,
	labelClassName = '',
	inputClassName = ''
}: Props) {
	const classForRequired = required ? "after:content-['*'] after:ml-0.5" : '';
	const [target, setTarget] = useState<Target<string[]>>({ name, value: [''] });

	const handleAddBtnClick = useCallback(
		(ev: MouseEvent<HTMLButtonElement>) => {
			setTarget((prev) => ({ ...prev, value: [...prev.value, ''] }));
			onChange({ target, preventDefault: () => {} });
		},
		[setTarget, target, onChange]
	);

	const handleCloseBtnClick = useCallback(
		(index: number) => {
			setTarget((prev) => ({ ...prev, value: prev.value.filter((v, i) => index !== i) }));
			onChange({ target, preventDefault: () => {} });
		},
		[setTarget, target, onChange]
	);

	const handleInputChange = useCallback(
		(ev: ChangeEvent<HTMLInputElement>) => {
			ev.preventDefault();
			const indexStr = ev.target.dataset.index as string;
			const index = parseInt(indexStr);
			const newValue = ev.target.value;

			setTarget((prev) => ({
				...prev,
				value: prev.value.map((v, i) => (i === index ? newValue : v))
			}));
			onChange({ target, preventDefault: () => {} });
		},
		[setTarget, target, onChange]
	);

	return (
		<label className='block mb-5 px-10 py-5'>
			<span
				data-cy-label
				className={`block text-lg font-medium text-slate-700 ${classForRequired} ${labelClassName}`}
			>
				{text}
			</span>
			<span className='inline-block p-5' onClick={handleAddBtnClick}>
				+
			</span>
			{target.value.map((value, index) => (
				<div key={index} className='grid grid-cols-2'>
					<input
						required={required}
						data-cy-multi-text-input
						data-index={index}
						type='text'
						className={`mt-1 px-3 py-2 bg-white border shadow-sm border-slate-300 placeholder-slate-400 focus:outline-none block w-full rounded-md sm:text-md focus:ring-1 ${inputClassName}`}
						placeholder={placeholder}
						onChange={handleInputChange}
						value={value}
					/>
					<span className='inline-block p-5' onClick={() => handleCloseBtnClick(index)}>
						x
					</span>
				</div>
			))}
		</label>
	);
}

interface Props {
	name?: string;
	label: string;
	placeholder?: string;
	onChange: (ev: CustomInputEvent<string[]>) => void;
	required?: boolean;
	labelClassName?: string;
	inputClassName?: string;
}

export interface CustomInputEvent<T> {
	target: Target<T>;
	preventDefault: () => void;
}

interface Target<T> {
	name: string;
	value: T;
}
