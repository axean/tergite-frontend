import HeaderCell from './components/HeaderCell';

export default function TableHeader({ data }: Props) {
	return (
		<thead>
			<tr>
				{data.map(({ label, className }) => (
					<HeaderCell key={label} text={label} className={className} />
				))}

				<HeaderCell text='Actions' />
			</tr>
		</thead>
	);
}

interface Props {
	data: Record[];
}

interface Record {
	label: string;
	className?: string;
}

