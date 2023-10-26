import { PropsWithChildren } from 'react';

export default function DataCell({ children, className = '' }: PropsWithChildren<Props>) {
	return (
		<td className={`border-b border-slate-100 p-4 pl-8 text-slate-500 ${className}`}>
			{children}
		</td>
	);
}
interface Props {
	className?: string;
}
