import { TableContainer, Table, Thead, Tr, Th, Tbody, Td } from '@chakra-ui/react';
import React from 'react';
import { useQuery } from 'react-query';

interface GateTableProps {
	data: any;
}

function parseValue(value: number, exponent: number) {
	return (value * 10 ** exponent).toPrecision(3);
}

const GateTable = ({ data }: GateTableProps) => {
	console.log(data);

	return (
		<TableContainer>
			<Table variant='striped' colorScheme='teal'>
				<Thead>
					<Tr>
						<Th>Gate</Th>
						<Th>Name</Th>
						<Th>Qubit</Th>
						<Th>Pulse Amp</Th>
						<Th>Pulse Freq</Th>
						<Th>Pulse Drag</Th>
						<Th>Pulse Detune</Th>
						<Th>Qubit Pulse Length</Th>
						<Th>Gate Err</Th>
					</Tr>
				</Thead>
				<Tbody>
					{data.gates.map((gate) => (
						<Tr key={gate.id}>
							<Td>G{gate.id}</Td>
							<Td>{gate.name}</Td>
							<Td>{gate.qubits[0]}</Td>
							<Td>{gate.dynamic_properties[0].value.toPrecision(3)}V</Td>
							<Td>{parseValue(gate.dynamic_properties[1].value, -6)}MHz</Td>
							<Td>{gate.dynamic_properties[2].value.toPrecision(3)}V</Td>
							<Td>{parseValue(gate.dynamic_properties[3].value, -6)}MHz</Td>
							<Td>{parseValue(gate.dynamic_properties[4].value, 9)}ns</Td>
							<Td>{parseValue(gate.dynamic_properties[5].value, 3)}mHz</Td>
						</Tr>
					))}
				</Tbody>
			</Table>
		</TableContainer>
	);
};

export default GateTable;
