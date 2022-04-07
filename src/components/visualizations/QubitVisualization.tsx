import { Flex, Box } from '@chakra-ui/react';
import { useState } from 'react';
import { useQuery } from 'react-query';
import ConnectivityMap from '../connectivityMap/';

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

function fixDirections(links): LinkAligned[] {
	// this function ensures that for all links {x0,y0,x1,y1} x0 < x1 and y0 < y1
	// this is needed for the padding of the links to work correctly
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

	return newLinks;
}
const newData = { nodes: dataSample.nodes, links: fixDirections(dataSample.links) };
const QubitVisualization: React.FC<QubitVisualizationProps> = () => {
	const { isLoading, error, data } = useQuery('backendOverview', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/pingu').then((res) => res.json())
	);

	const [selectedNode, setSelectedNode] = useState<number>(0);
	if (isLoading) return <h1>loading</h1>;
	if (error) return <h1>error</h1>;

	const myData = {
		nodes: [{ x: 0, y: 0, id: 100 }, { x: 4, y: 4, id: 100 }, ...data.qubits] as Point[],
		links: newData.links
	};

	return (
		<Box>
			<Flex gap='4'>
				<Box flex='1'>
					<ConnectivityMap
						data={myData}
						type='node'
						onSelectNode={(id) => setSelectedNode(id)}
					/>
				</Box>
				<Box flex='1'>
					<ConnectivityMap
						data={myData}
						onSelectLink={() => console.log('link selected')}
						type='link'
					/>
				</Box>
			</Flex>
			{selectedNode}
		</Box>
	);
};

export default QubitVisualization;
