import { useMemo } from 'react';
import TableBody, { ActionProps, DataRecord } from './components/TableBody';
import TableHeader from './components/TableHeader';

export default function DataTable({ titles, data, actions, getKey }: Props) {
	const headerData = useMemo(
		() => titles.map((v) => ({ label: v.label || v.field, className: v.className })),
		[titles]
	);
	const fields = useMemo(() => titles.map((v) => v.field), [titles]);

	return (
		<section
			id='data-table'
			className='bg-slate-50 w-full border border-west-coast-300 rounded '
		>
			<table className='table-fixed w-full border-collapse text-sm'>
				<TableHeader data={headerData} />
				<TableBody getKey={getKey} fields={fields} data={data} actions={actions} />
			</table>
		</section>
	);
}

interface Props {
	titles: TitleProps[];
	actions: ActionProps[];
	data: DataRecord[];
	getKey: (record: any) => string;
}

interface TitleProps {
	label?: string;
	className?: string;
	field: string;
}

