import { Select } from '@chakra-ui/react';
import React, { ChangeEventHandler } from 'react';

export default function QubitSelector({ value, qubits }: Props) {
	return (
		<Select
			size='sm'
			value={value}
			onChange={(e) => {
				e.preventDefault();
			}}
			w='25'
			variant='outline'
			outline='1px'
		>
			{qubits.map((qubit) => (
				<option key={qubit} value={qubit}>
					Qubit: {qubit}
				</option>
			))}
		</Select>
	);
}

interface Props {
	value: string;
	qubits: string[];
	onChange: ChangeEventHandler<HTMLSelectElement>;
}
