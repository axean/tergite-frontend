import {
	Box,
	Table,
	TableCaption,
	TableContainer,
	Tbody,
	Td,
	Tfoot,
	Th,
	Thead,
	Tr
} from '@chakra-ui/react';
import React from 'react';
import { QueryClient, useQuery } from 'react-query';

interface QubitTableProps {
	data:any;
}

function parseValue(value: number, exponent: number) {
	return (value * 10 ** exponent).toPrecision(4);
}

const QubitTable = ({data}:QubitTableProps) => {

	console.log(data);

	return (
		<TableContainer>
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
								{parseValue(qubit.dynamic_properties[0].value, 6)} {'\u03BC'}s
							</Td>
							<Td>
								{parseValue(qubit.dynamic_properties[1].value, 6)}
								{'\u03BC'}s
							</Td>
							<Td>
								{parseValue(qubit.dynamic_properties[2].value, 6)}
								{'\u03BC'}s
							</Td>
							
							<Td>{parseValue(qubit.static_properties[0].value, -9)} GHz</Td>
							<Td>{parseValue(qubit.static_properties[1].value, -6)} MHz</Td>
							<Td>{parseValue(qubit.static_properties[2].value, -6)} MHz</Td>
							<Td>{parseValue(qubit.static_properties[3].value, -6)} ms</Td>
							<Td>{parseValue(qubit.static_properties[4].value, -6)} ms</Td>
						</Tr>
					))}
				</Tbody>
			</Table>
		</TableContainer>
	);
};

export default QubitTable;

/*

"id": 0,
"x": 0,
"y": 1,
"xy_drive_line": 0,
"z_drive_line": 1,
"dynamic_properties": [
{
"date": "2022-04-04T11:26:11.854380",
"name": "qubit_T1",
"unit": "Hz",
"value": 0.00009625478624706575,
"types": [
"type1",
"type2",
"type4_domain"
]
},
{
"date": "2022-04-04T11:26:11.854392",
"name": "qubit_T2_star",
"unit": "Hz",
"value": 0.000042560743067795404,
"types": [
"type1",
"type2",
"type4_domain"
]
},
{
"date": "2022-04-04T11:26:11.854397",
"name": "qubit_T_phi",
"unit": "",
"value": 0.00009087719176282802,
"types": [
"type1",
"type2",
"type4_domain"
]
},
{
"date": "2022-04-04T11:24:11.737828",
"name": "assignment_error_ge",
"unit": "",
"value": 0.08650511817436249,
"types": [
"type1"
]
}
],
"static_properties": [
{
"date": "2022-04-03T20:17:25.692081",
"name": "frequency",
"unit": "Hz",
"value": 4249139500.1209745,
"types": [
"type1",
"type4_domain"
]
},
{
"date": "2022-04-03T20:17:25.692083",
"name": "chi_shift",
"unit": "Hz",
"value": 3465687.6600888493,
"types": [
"type1"
]
},
{
"date": "2022-04-03T20:17:25.692085",
"name": "g_rq",
"unit": "Hz",
"value": 71836631.3581153,
"types": [
"type1"
]
},
{
"date": "2022-04-03T20:17:25.692087",
"name": "qubit_Tpurcell",
"unit": "s",
"value": 8166964502.835002,
"types": [
"type1"
]
},
{
"date": "2022-04-03T20:17:25.692088",
"name": "qubit_Tdrive",
"unit": "s",
"value": 652280333.7453165,
"types": [
"type1"
]
},
{
"date": "2022-04-03T20:17:25.692030",
"name": "J_qc_{0,0}",
"unit": "Hz",
"value": 91584846.98362987,
"types": [
"type1"
]
},
{
"date": "2022-04-03T20:17:25.692046",
"name": "J_qc_{0,1}",
"unit": "Hz",
"value": 0.43483740554024297,
"types": [
"type1"
]
},
{
"date": "2022-04-03T20:17:25.692052",
"name": "J_qc_{0,2}",
"unit": "Hz",
"value": 0.005025730712419322,
"types": [
"type1"
]
},
{
"date": "2022-04-03T20:17:25.692056",
"name": "J_qc_{0,3}",
"unit": "Hz",
"value": 0.003308520887742762,
"types": [
"type1"
]
},
{
"date": "2022-04-03T20:17:25.692061",
"name": "J_qc_{0,4}",
"unit": "Hz",
"value": 0.0067623140285471214,
"types": [
"type1"
]
},
{
"date": "2022-04-03T20:17:25.692065",
"name": "J_qc_{0,5}",
"unit": "Hz",
"value": 0.007652368141392605,
"types": [
"type1"
]
},
{
"date": "2022-04-03T20:17:25.692069",
"name": "J_qc_{0,6}",
"unit": "Hz",
"value": 0.001151643441464607,
"types": [
"type1"
]
},
{
"date": "2022-04-03T20:17:25.692072",
"name": "J_qc_{0,7}",
"unit": "Hz",
"value": 0.008920415613700912,
"types": [
"type1"
]
},
{
"date": "2022-04-03T20:17:25.692076",
"name": "J_qc_{0,8}",
"unit": "Hz",
"value": 0.0043823285955964485,
"types": [
"type1"
]
}
]
*/
