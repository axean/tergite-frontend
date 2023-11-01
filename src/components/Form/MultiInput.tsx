import {
	ChangeEvent,
	HTMLInputTypeAttribute,
	MouseEvent,
	useCallback,
	useMemo,
	useState
} from 'react';
import ErrorText from '../ErrorText';

export function MultiInput<T>({
	name = '',
	value,
	label: text,
	type = 'text',
	placeholder = '',
	disabled,
	onChange,
	required = false,
	labelClassName = '',
	inputClassName = ''
}: Props) {
	const classForRequired = required ? "after:content-['*'] after:ml-0.5" : '';
	const defaultValue = useMemo(() => (type == 'number' ? [0] : ['']), [type]);
	const [target, setTarget] = useState<Target<(string | number)[]>>({
		name,
		value: value || defaultValue
	});
	const [error, setError] = useState<string>();

	const handleAddBtnClick = useCallback(
		(ev: MouseEvent<HTMLButtonElement>) => {
			ev.preventDefault();
			setError(undefined);
			const newTarget = { ...target, value: [...target.value, defaultValue[0]] };
			setTarget(newTarget);
			onChange({ target: newTarget, preventDefault: () => {} });
		},
		[setTarget, target, onChange, defaultValue]
	);

	const handleCloseBtnClick = useCallback(
		(index: number) => {
			if (required && target.value.length <= 1) {
				setError('At least one input is needed');
			} else {
				const newTarget = { ...target, value: target.value.filter((v, i) => index !== i) };
				setTarget({ ...newTarget });
				onChange({ target: newTarget, preventDefault: () => {} });
			}
		},
		[setTarget, target, onChange, required]
	);

	const handleInputChange = useCallback(
		(ev: ChangeEvent<HTMLInputElement>) => {
			ev.preventDefault();
			setError(undefined);
			const indexStr = ev.target.dataset.index as string;
			const index = parseInt(indexStr);
			const newValue = ev.target.value;

			const newTarget = {
				...target,
				value: target.value.map((v, i) => (i === index ? newValue : v))
			};

			setTarget({ ...newTarget });
			onChange({ target: newTarget, preventDefault: () => {} });
		},
		[setTarget, target, onChange]
	);

	return (
		<label data-cy-multi-input={text} className='block mb-5 px-10 py-5'>
			<span
				data-cy-label
				className={`block text-lg font-medium text-slate-700 ${classForRequired} ${labelClassName}`}
			>
				{text}
			</span>
			{error && <ErrorText text={error} />}
			{target.value.map((item, index) => (
				<div
					data-cy-input-wrapper={item}
					aria-disabled={disabled}
					key={index}
					className={`flex rounded-md bg-white border shadow-sm border-slate-300 focus:outline-none disabled:bg-slate-100  divide-x divide-slate-300 ${inputClassName}`}
				>
					<input
						disabled={disabled}
						required={required}
						data-cy-inner-input={index}
						data-index={index}
						type={type}
						className={`mt-1 px-3 py-2 placeholder-slate-400 focus:outline-none block w-full sm:text-md disabled:bg-slate-100 disabled:text-slate-500`}
						placeholder={placeholder}
						onChange={handleInputChange}
						value={item}
					/>
					<button
						data-cy-multi-input-close-btn={index}
						className='p-2 rounded-r-md sm:text-md hover:bg-west-coast hover:text-white'
						onClick={() => handleCloseBtnClick(index)}
					>
						x
					</button>
				</div>
			))}
			<button
				data-cy-multi-input-add-btn
				className='rounded bg-white border-slate-300 p-2 mt-1 hover:bg-west-coast hover:text-white  border border-west-coast-300 hover:border-transparent'
				onClick={handleAddBtnClick}
			>
				+
			</button>
		</label>
	);
}

interface Props {
	name?: string;
	value?: (string | number)[];
	label: string;
	disabled?: boolean;
	type?: HTMLInputTypeAttribute;
	placeholder?: string;
	onChange: (ev: MultipleInputEvent<(string | number)[]>) => void;
	required?: boolean;
	labelClassName?: string;
	inputClassName?: string;
}

export interface MultipleInputEvent<T> {
	target: Target<T>;
	preventDefault: () => void;
}

interface Target<T> {
	name: string;
	value: T;
}
