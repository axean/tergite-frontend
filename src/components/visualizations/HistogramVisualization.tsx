import {
	Alert,
	AlertDescription,
	AlertIcon,
	AlertTitle,
	Box,
	Flex,
	Spacer
} from '@chakra-ui/react';
import React, { useContext, useLayoutEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { BackendContext, MapActions, useSelectionMaps } from '../../state/BackendContext';
import DatePicker from '../DatePicker';
import Histogram from '../histogram/Histogram';
import RadioButtons from '../RadioButtons';
import { VisualizationSkeleton } from '../VisualizationSkeleton';
import ApiRoutes from '../../utils/ApiRoutes';
import { fetchVizualitationData } from '../../utils/apiClient';
import ErrorAlert from '../ErrorAlert';

interface HistogramVisualizationProps {
	backend: string | string[];
}

export const HistogramVisualization: React.FC<HistogramVisualizationProps> = ({ backend }) => {
	const [state, dispatch] = useContext(BackendContext);
	const { setSelectionMap } = useSelectionMaps();

	const { isLoading, data, error, refetch, isFetching } = useQuery(
		'histogramData',
		async () =>
			await fetchVizualitationData({
				backend: `${backend}`,
				timeFrom: state.timeFrom,
				timeTo: state.timeTo,
				type: 'type2'
			})
	);

	const [dataToVisualize, setDataToVisualize] = useState<string>('T1');

	useLayoutEffect(() => {
		setSelectionMap(false, true);
		if (state.selectedNode === -1) {
			dispatch({ type: MapActions.SELECT_NODE, payload: 0 });
		}
	}, [setSelectionMap, dispatch, state.selectedNode]);

	if (error) return <ErrorAlert error={error as Error} />;

	if (isLoading || isFetching) return <VisualizationSkeleton />;

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
					<DatePicker refetchFunction={refetch}></DatePicker>
				</Box>
			</Flex>
			{dataToVisualize === 'T1' && data && (
				<Histogram
					data={data.qubits[state.selectedNode].qubit_T1.map((t1data) => ({
						x: t1data.value * 1000000
					}))}
					label='T1(us)'
					data-cy-histogram-t1-clicked
				></Histogram>
			)}
			{dataToVisualize === 'T2' && (
				<Histogram
					data={data.qubits[state.selectedNode].qubit_T2_star.map((t2data) => ({
						x: t2data.value * 1000000
					}))}
					label='T2(us)'
					data-cy-histogram-t2-clicked
				></Histogram>
			)}
			{dataToVisualize === 'T' + '\u03C6' && (
				<Histogram
					data={data.qubits[state.selectedNode].qubit_T_phi.map((t2data) => ({
						x: t2data.value * 1000000
					}))}
					label='TPhi(us)'
					data-cy-histogram-tphi-clicked
				></Histogram>
			)}
		</Box>
	);
};
