import { PropsWithChildren } from 'react';
export { MultiTextInput, type CustomInputEvent } from './MultiTextInput';
export { TextInput } from './TextInput';
export { NumberInput } from './NumberInput';

export default function Form({
	children,
	className = '',
	action,
	method
}: PropsWithChildren<Props>) {
	return (
		<form className={className} action={action} method={method}>
			{children}
		</form>
	);
}

interface Props {
	className?: string;
	action?: string;
	method?: string;
}

