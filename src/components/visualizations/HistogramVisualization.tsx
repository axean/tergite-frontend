import { Box, Flex, Spacer } from '@chakra-ui/react';
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import DatePicker from '../DatePicker';
import Histogram from '../Histogram';
import RadioButtons from '../RadioButtons';

interface HistogramVisualizationProps {
	backend: string | string[];
	qubitId: number;
}

export const HistogramVisualization: React.FC<HistogramVisualizationProps> = ({ backend, qubitId }) => {
	const { isLoading, data, error } = useQuery('histogramData', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/' + backend + '/type2/period/').then((res) => res.json())
	);

	const [dataToVisualize, setDataToVisualize] = useState<string>('T1');
	const [timeSpan, setTimeSpan] = useState({
		startDate: new Date(),
		endDate: new Date()
	});

	if (isLoading) return <span>'Loading...'</span>;

	if (error) return <span>Error</span>;

	//console.log(data)
	console.log(dataToVisualize);
	console.log(timeSpan);

	console.log('T1', data.qubits[qubitId].qubit_T1.map((t1data) => ({x: t1data.value})))
	console.log('T2', data.qubits[qubitId].qubit_T2_star.map((t2data) => ({x: t2data.value})))
	console.log('TPHI', data.qubits[qubitId].qubit_T_phi.map((tPhidata) => ({x: tPhidata.value})))

	return (
		<Box>
			<Flex flexDir={'row'} align={'center'} p={3}>
				<Box ml={'3em'}>
					<RadioButtons
						setTab={setDataToVisualize}
						tabs={['T1', 'T2', 'T' + '\u03C6']}
					></RadioButtons>
				</Box>
				<Spacer />
				<Box mr='3em'>
					<DatePicker setDates={setTimeSpan}></DatePicker>
				</Box>
			</Flex>
			{dataToVisualize === 'T1' && <Histogram data={data.qubits[qubitId].qubit_T1.map((t1data) => ({x: t1data.value}))} label='T1(us)'></Histogram>}
			{dataToVisualize === 'T2' && <Histogram data={data.qubits[qubitId].qubit_T2_star.map((t2data) => ({x: t2data.value}))} label='T2(us)'></Histogram>}
			{dataToVisualize === 'T'+'\u03C6'&& <Histogram data={data.qubits[qubitId].qubit_T2_star.map((t2data) => ({x: t2data.value}))} label='TPhi(us)'></Histogram>}
		</Box>
	);
};
