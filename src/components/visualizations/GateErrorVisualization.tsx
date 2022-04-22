import { Box, Flex } from '@chakra-ui/react';
import React, { useContext } from 'react';
import { useQuery } from 'react-query';
import { BackendContext } from '../../state/BackendContext';
import BoxPlot from '../BoxPlot';
import DatePicker from '../DatePicker';

interface GateErrorVisualizationProps {
	backend: string | string[];
}

export const GateErrorVisualization: React.FC<GateErrorVisualizationProps> = ({ backend }) => {
	const [state, dispatch] = useContext(BackendContext);

	const { isLoading, data, error, refetch, isFetching } = useQuery('gateError', () =>
		fetch(
			'http://qtl-webgui-2.mc2.chalmers.se:8080/devices/' +
				backend +
				'/type3/period?from=' +
				state.timeFrom.toISOString() +
				'&to=' +
				state.timeTo.toISOString()
		).then((res) => res.json())
	);

	if (isLoading) return <span>Loading...</span>;

	if (error) return <span>Error</span>;

	if (isFetching) return <span>is fetching</span>;

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
