import { Box, Flex } from '@chakra-ui/react';
import React, { useContext, useLayoutEffect } from 'react';
import { useQuery } from 'react-query';
import { BackendContext, useSelectionMaps } from '../../state/BackendContext';
import BoxPlot from '../boxPlot/BoxPlot';
import DatePicker from '../DatePicker';
import { VisualizationSkeleton } from '../VisualizationSkeleton';
import { fetchVizualitationData } from '../../utils/apiClient';
import ErrorAlert from '../ErrorAlert';

interface GateErrorVisualizationProps {
	backend: string | string[];
}

export const GateErrorVisualization: React.FC<GateErrorVisualizationProps> = ({ backend }) => {
	const [state] = useContext(BackendContext);
	const { setSelectionMap } = useSelectionMaps();

	const { isLoading, data, error, refetch, isFetching } = useQuery(
		'gateError',
		async () =>
			await fetchVizualitationData({
				backend: `${backend}`,
				timeFrom: state.timeFrom,
				timeTo: state.timeTo,
				type: 'type3'
			})
	);

	useLayoutEffect(() => {
		setSelectionMap(false, false);
	}, []);

	if (error) return <ErrorAlert error={error as Error} />;
	if (isLoading || isFetching) return <VisualizationSkeleton />;

	return (
		<Box>
			<Flex flexDir={'row'} align={'center'} p={3}>
				<Box ml={'auto'} mr={'3em'}>
					<DatePicker refetchFunction={refetch}></DatePicker>
				</Box>
			</Flex>
			<BoxPlot
				data={data.gates.map((gate) => ({
					x: gate.id,
					y: gate.gate_err.map((e) => e.value)
				}))}
			></BoxPlot>
		</Box>
	);
};
