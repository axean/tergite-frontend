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
		{ source: nodes[0], target: nodes[2] },
		{ source: nodes[1], target: nodes[3] },
		{ source: nodes[3], target: nodes[2] }
	]
};

function fixFlowDirection(links) {
	// this function ensures that for all links {x0,y0,x1,y1} x0 < x1 and y0 < y1
	// this is needed for the padding of the links to work correctly
	console.log('before', links);
	const newLinks = links.map((el) => {
		let { source, target } = el;
		let temp;
		if (source.x < target.x) {
			temp = source;
			source = target;
			target = temp;
		} else if (source.y < target.y) {
			temp = source;
			source = target;
			target = temp;
		}

		return { source, target, vertical: source.x === target.x ? true : false };
	});

	console.log('after', newLinks);
	return newLinks;
}
const newData = { nodes: dataSample.nodes, links: fixFlowDirection(dataSample.links) };
console.log('new link', newData.links);
const QubitVisualization: React.FC<QubitVisualizationProps> = () => {
	return (
		<Flex gap='4'>
			<Box flex='1'>
				<ConnectivityMap data={newData} type='node' />
			</Box>
			<Box flex='1'>
				<ConnectivityMap data={newData} type='link' />
			</Box>
		</Flex>
	);
};

export default QubitVisualization;
