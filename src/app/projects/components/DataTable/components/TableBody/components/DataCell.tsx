import { PropsWithChildren } from 'react';

export default function DataCell({
	children,
	className = '',
	dataCyDataCell = ''
}: PropsWithChildren<Props>) {
	return (
		<td
			data-cy-data-cell={dataCyDataCell}
			className={`border-b border-slate-100 p-4 pl-8 text-slate-500 ${className}`}
		>
			{children}
		</td>
	);
}
interface Props {
	dataCyDataCell?: string;
	className?: string;
}
