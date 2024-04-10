import { asMultipleOfTen } from '@/utils/browser';
import { Table, TableContainer, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import React from 'react';

export default function QubitTable({ data }: Props) {
	return (
		<TableContainer data-cy-qubit-table>
			<Table variant='striped' colorScheme='teal'>
				<Thead>
					<Tr>
						<Th>Qubit</Th>
						<Th>Index[X,Y]</Th>
						<Th>T1</Th>
						<Th>T2*</Th>
						<Th>T_{'\u03A6'}</Th>
						<Th>Frequency</Th>
						<Th>{'\u03C7'}_shift</Th>
						<Th>G_rq</Th>
						<Th>Q_Tpurcell</Th>
						<Th>Q_Tdrive</Th>
					</Tr>
				</Thead>
				<Tbody>
					{data.qubits.map((qubit) => (
						<Tr key={qubit.id}>
							<Td>Q{qubit.id}</Td>
							<Td>
								{qubit.x} , {qubit.y}
							</Td>
							<Td>
								{asMultipleOfTen(qubit.dynamic_properties[0].value, 6, 4)}{' '}
								{'\u03BC'}s
							</Td>
							<Td>
								{asMultipleOfTen(qubit.dynamic_properties[1].value, 6, 4)}
								{'\u03BC'}s
							</Td>
							<Td>
								{asMultipleOfTen(qubit.dynamic_properties[2].value, 6, 4)}
								{'\u03BC'}s
							</Td>

							<Td>{asMultipleOfTen(qubit.static_properties[0].value, -9, 4)} GHz</Td>
							<Td>{asMultipleOfTen(qubit.static_properties[1].value, -6, 4)} MHz</Td>
							<Td>{asMultipleOfTen(qubit.static_properties[2].value, -6, 4)} MHz</Td>
							<Td>{asMultipleOfTen(qubit.static_properties[3].value, -6, 4)} ms</Td>
							<Td>{asMultipleOfTen(qubit.static_properties[4].value, -6, 4)} ms</Td>
						</Tr>
					))}
				</Tbody>
			</Table>
		</TableContainer>
	);
}

interface Props {
	data: API.Response.DeviceDetail;
}
