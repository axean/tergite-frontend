import { Flex, Box } from '@chakra-ui/react';
import ConnectivityMap from '../ConnectivityMap';

type QubitVisualizationProps = {};

const nodes = [
	{ x: 0, y: 0 },

	{ x: 1, y: 0 },

	{ x: 0, y: 1 },

	{ x: 1, y: 1 }
];

const dataSample = {
	nodes,

	links: [
		{ source: nodes[0], target: nodes[1] },

		{ source: nodes[1], target: nodes[3] },

		{ source: nodes[2], target: nodes[0] },

		{ source: nodes[3], target: nodes[2] }
	]
};

const QubitVisualization: React.FC<QubitVisualizationProps> = () => {
	return (
		<Flex gap='4'>
			<Box flex='1'>
				<ConnectivityMap data={dataSample} type='node' />
			</Box>
			<Box flex='1'>
				<ConnectivityMap data={dataSample} type='node' />
			</Box>
		</Flex>
	);
};

export default QubitVisualization;
