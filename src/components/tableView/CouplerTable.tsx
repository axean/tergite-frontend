import { TableContainer, Table, Thead, Tr, Th, Tbody, Td } from '@chakra-ui/react';
import React from 'react';
import { useQuery } from 'react-query';

interface CouplerTableProps {
	data: any;
}

function parseValue(value: number, exponent: number) {
	return (value * 10 ** exponent).toPrecision(3);
}

const CouplerTable = ({ data }: CouplerTableProps) => {
	console.log(data);

	return (
		<TableContainer data-cy-coupler-table>
			<Table variant='striped' colorScheme='teal'>
				<Thead>
					<Tr>
						<Th>Coupler</Th>
						<Th>Z Drive Line</Th>
						<Th>Qubits</Th>
						<Th>Bias V</Th>
						<Th>Freq Max</Th>
						<Th>Coupler V0</Th>
						<Th>Asymetry</Th>
					</Tr>
				</Thead>
				<Tbody>
					{data.couplers.map((coupler) => (
						<Tr key={coupler.id}>
							<Td>C{coupler.id}</Td>
							<Td>{coupler.z_drive_line}</Td>
							<Td>
								{coupler.qubits[0]}, {coupler.qubits[1]}
							</Td>
							<Td>{coupler.dynamic_properties[0].value.toPrecision(3)}V</Td>
							<Td>{parseValue(coupler.static_properties[0].value, -9)}GHz</Td>
							<Td>{coupler.static_properties[1].value.toPrecision(3)}V</Td>
							<Td>{coupler.static_properties[2].value.toPrecision(3)}</Td>
						</Tr>
					))}
				</Tbody>
			</Table>
		</TableContainer>
	);
};

export default CouplerTable;
