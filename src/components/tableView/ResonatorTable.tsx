import { TableContainer, Table, Thead, Tr, Th, Tbody, Td } from '@chakra-ui/react';
import React from 'react';
import { useQuery } from 'react-query';

interface ResonatorTableProps {
	data: any;
}

function parseValue(value: number, exponent: number) {
	return (value * 10 ** exponent).toPrecision(3);
}

const ResonatorTable = ({ data }: ResonatorTableProps) => {
	console.log(data);

	return (
		<TableContainer>
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
						{/*<Th>Q_i</Th>
              <Th>Q_c</Th> */}
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
								{parseValue(resonator.dynamic_properties[0].value, 6).slice(0, 3)}{' '}
								{'\u03BC'}s
							</Td>
							<Td>{parseValue(resonator.dynamic_properties[1].value, 3)} mA</Td>
							<Td>{parseValue(resonator.dynamic_properties[2].value, -6)}MHz</Td>
							<Td>{parseValue(resonator.static_properties[0].value, -9)}GHz</Td>
							<Td>{parseValue(resonator.static_properties[1].value, -9)}GHz</Td>
							<Td>{parseValue(resonator.static_properties[2].value, -9)}GHz</Td>
							{/* <Td>{parseValue(resonator.static_properties[3].value,-6)} M unit?</Td> */}
							{/* <Td>{parseValue(resonator.static_properties[4].value,-3)} K unit?</Td> */}
							<Td>{parseValue(resonator.static_properties[5].value, -3)}kHz</Td>
						</Tr>
					))}
				</Tbody>
			</Table>
		</TableContainer>
	);
};

export default ResonatorTable;

/*

"id": 0,
"x": 0,
"y": 1,
"readout_line": 33,
"dynamic_properties": [
{
"date": "2022-04-04T13:55:19.598763",
"name": "read_length",
"unit": "s",
"value": 1e-7,
"types": [
"type1",
"type4_codomain"
]
},
{
"date": "2022-04-04T13:54:19.536750",
"name": "read_amp",
"unit": "V",
"value": 0.06392732457237156,
"types": [
"type1",
"type4_codomain"
]
},
{
"date": "2022-04-04T14:00:19.873833",
"name": "read_mod",
"unit": "Hz",
"value": 189787814.46497774,
"types": [
"type1"
]
}
],
"static_properties": [
{
"date": "2022-04-03T20:17:25.692701",
"name": "frequency",
"unit": "Hz",
"value": 6224368022.706409,
"types": [
"type1",
"type4_domain"
]
},
{
"date": "2022-04-03T20:17:25.692702",
"name": "frequency_ge",
"unit": "Hz",
"value": 7109540959.879529,
"types": [
"type1"
]
},
{
"date": "2022-04-03T20:17:25.692706",
"name": "frequency_gef",
"unit": "Hz",
"value": 6841973956.218915,
"types": [
"type1"
]
},
{
"date": "2022-04-03T20:17:25.692708",
"name": "Q_i",
"unit": "",
"value": 1110602.6768609372,
"types": [
"type1"
]
},
{
"date": "2022-04-03T20:17:25.692710",
"name": "Q_c",
"unit": "",
"value": 51930.40152298606,
"types": [
"type1"
]
},
{
"date": "2022-04-03T20:17:25.692712",
"name": "kappa",
"unit": "Hz",
"value": 409200.59685953666,
"types": [
"type1"
]

*/
