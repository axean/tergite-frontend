import { asMultipleOfTen } from '@/utils/browser';
import { TableContainer, Table, Thead, Tr, Th, Tbody, Td } from '@chakra-ui/react';
import React from 'react';

export default function ResonatorTable({ data }: Props) {
	return (
		<TableContainer data-cy-res-table>
			<Table variant='striped' colorScheme='teal'>
				<Thead>
					<Tr>
						<Th>Resonator</Th>
						<Th>Index[X,Y]</Th>
						<Th>Readout Line</Th>
						<Th>Read Length</Th>
						<Th>Read Amp</Th>
						<Th>Read Mod</Th>
						<Th>Frequency</Th>
						<Th>Frequency ge</Th>
						<Th>Frequency Gef</Th>
						<Th>{'\u03BA'}</Th>
					</Tr>
				</Thead>
				<Tbody>
					{data.resonators.map((resonator) => (
						<Tr key={resonator.id}>
							<Td>R{resonator.id}</Td>
							<Td>
								{resonator.x},{resonator.y}
							</Td>
							<Td>{resonator.readout_line}</Td>
							<Td>
								{asMultipleOfTen(resonator.dynamic_properties[0].value, 6).slice(
									0,
									3
								)}{' '}
								{'\u03BC'}s
							</Td>
							<Td>{asMultipleOfTen(resonator.dynamic_properties[1].value, 3)} mA</Td>
							<Td>{asMultipleOfTen(resonator.dynamic_properties[2].value, -6)}MHz</Td>
							<Td>{asMultipleOfTen(resonator.static_properties[0].value, -9)}GHz</Td>
							<Td>{asMultipleOfTen(resonator.static_properties[1].value, -9)}GHz</Td>
							<Td>{asMultipleOfTen(resonator.static_properties[2].value, -9)}GHz</Td>
							<Td>{asMultipleOfTen(resonator.static_properties[5].value, -3)}kHz</Td>
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
