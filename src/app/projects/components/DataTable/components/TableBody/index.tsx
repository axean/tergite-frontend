import ActionBtn from './components/ActionBtn';
import DataCell from './components/DataCell';

export default function TableBody({ fields, actions, getKey, data }: Props) {
	return (
		<tbody className='bg-white'>
			{data.map((item) => (
				<tr key={getKey(item)}>
					{fields.map((field) => (
						<DataCell key={field} dataCyDataCell={`${getKey(item)}-${field}`}>
							{item[field]}
						</DataCell>
					))}

					<DataCell dataCyDataCell={`${getKey(item)}--action`}>
						{actions.map(({ getLabel, getLink }, index) => (
							<ActionBtn key={index} text={getLabel(item)} link={getLink(item)} />
						))}
					</DataCell>
				</tr>
			))}
		</tbody>
	);
}

interface Props {
	fields: string[];
	actions: ActionProps[];
	data: DataRecord[];
	getKey: (record: DataRecord) => string;
}

export interface ActionProps {
	getLabel: (record: any) => string;
	getLink: (record: any) => string;
}

export interface DataRecord {
	[key: string]: any;
}
