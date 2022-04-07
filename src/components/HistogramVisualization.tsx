import { Box, Flex, Spacer } from '@chakra-ui/react';
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import DatePicker from './DatePicker';
import Histogram from './Histogram';
import RadioButtons from './RadioButtons';

interface HistogramVisualizationProps {
	qubitId: number
}

export const HistogramVisualization: React.FC<HistogramVisualizationProps> = ({}) => {
	const { isLoading, data, error } = useQuery('backendOverview', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/pingu').then((res) => res.json())
	);

	const [dataToVisualize, setDataToVisualize] = useState('');
	const [timeSpan, setTimeSpan] = useState<Date>();

	if (isLoading) return <span>'Loading...'</span>;

	if (error) return <span>Error</span>;

	const t1Data = data.qubits.map((qubit) => ({
		x: qubit.dynamic_properties[0].value * 1000000
	}));

	const t2Data = data.qubits.map((qubit) => ({
		x: qubit.dynamic_properties[1].value * 1000000
	}));

	const tPhiData = data.qubits.map((qubit) => ({
		x: qubit.dynamic_properties[2].value * 1000000
	}));

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
			<Histogram data={t1Data} label='T1(us)'></Histogram>
		</Box>
	);
};
