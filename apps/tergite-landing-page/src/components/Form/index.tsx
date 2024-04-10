import { PropsWithChildren } from 'react';
export { MultiInput, type MultipleInputEvent as CustomInputEvent } from './MultiInput';
export { Input } from './Input';

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
