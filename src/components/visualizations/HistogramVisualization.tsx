import { Box, Flex, Spacer } from '@chakra-ui/react';
import React, { useContext, useState } from 'react';
import { useQuery } from 'react-query';
import { BackendContext } from '../../state/BackendContext';
import DatePicker from '../DatePicker';
import Histogram from '../Histogram';
import RadioButtons from '../RadioButtons';

interface HistogramVisualizationProps {
	backend: string | string[];
}

export const HistogramVisualization: React.FC<HistogramVisualizationProps> = ({ backend }) => {
	const [state, dispatch] = useContext(BackendContext);

	const { isLoading, data, error, refetch } = useQuery('histogramData', () =>
		fetch(
			'http://qtl-webgui-2.mc2.chalmers.se:8080/devices/' +
				backend +
				'/type2/period?from=' +
				state.timeFrom.toISOString() +
				'&to=' +
				state.timeTo.toISOString()
		).then((res) => res.json())
	);

	console.log(data)

	const [dataToVisualize, setDataToVisualize] = useState<string>('T1');

	console.log(state.timeFrom);
	console.log(state.timeTo);

	if (isLoading) return <span>'Loading...'</span>;

	if (error) return <span>Error</span>;

	//console.log(data)
	// vconsole.log(dataToVisualize);
	// console.log(timeSpan);

	// console.log('T1', data.qubits[qubitId].qubit_T1.map((t1data) => ({x: t1data.value})))
	// console.log('T2', data.qubits[qubitId].qubit_T2_star.map((t2data) => ({x: t2data.value})))
	// console.log('TPHI', data.qubits[qubitId].qubit_T_phi.map((tPhidata) => ({x: tPhidata.value})))

	return (
		<Box>
		<span>{isLoading ? 'loading' : 'dddf'}</span>
		<span>{state.timeFrom.toISOString()}</span>
			<Flex flexDir={'row'} align={'center'} p={3}>
				<Box ml={'3em'}>
					<RadioButtons
						setTab={setDataToVisualize}
						tabs={['T1', 'T2', 'T' + '\u03C6']}
					></RadioButtons>
				</Box>
				<Spacer />
				<Box mr='3em'>
					<DatePicker refetchFunction={refetch}></DatePicker>
				</Box>
			</Flex>
			{dataToVisualize === 'T1' && (
				<Histogram
					data={data.qubits[0].qubit_T1.map((t1data) => ({ x: t1data.value * 1000000 }))}
					label='T1(us)'
				></Histogram>
			)}
			{dataToVisualize === 'T2' && (
				<Histogram
					data={data.qubits[0].qubit_T2_star.map((t2data) => ({
						x: t2data.value * 1000000
					}))}
					label='T2(us)'
				></Histogram>
			)}
			{dataToVisualize === 'T' + '\u03C6' && (
				<Histogram
					data={data.qubits[0].qubit_T_phi.map((t2data) => ({
						x: t2data.value * 1000000
					}))}
					label='TPhi(us)'
				></Histogram>
			)}
		</Box>
	);
};
