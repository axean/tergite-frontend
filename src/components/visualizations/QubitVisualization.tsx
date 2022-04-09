import { Flex, Box, Spinner, Grid, Skeleton } from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import ConnectivityMap from '../connectivityMap/';

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
type QubitVisualizationProps = {
	isCollapsed: boolean;
};
const QubitVisualization: React.FC<QubitVisualizationProps> = ({ isCollapsed }) => {
	const { isLoading, error, data } = useQuery('QubitVisualization', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/pingu').then((res) => res.json())
	);

	const [selectedNode, setSelectedNode] = useState<number>(0);
	const rerenderRef = useRef(isCollapsed);
	const [isRerendering, setIsRerendering] = useState(false);

	// this is needed to ensure proper resizing of the component after the sidepanel collapse/expand
	useEffect(() => {
		if (rerenderRef.current !== isCollapsed) {
			rerenderRef.current = isCollapsed;
			setIsRerendering(true);
			setTimeout(() => {
				setIsRerendering(false);
			}, 50);
		}
	}, [isCollapsed]);

	const myData = {
		nodes: [
			{ x: 0, y: 0, id: 100 },
			{ x: 4, y: 4, id: 100 },
			...(data !== undefined ? data.qubits : [])
		] as Point[],
		links: []
	};

	return (
		<Skeleton isLoaded={!isRerendering && !error && !isLoading && data !== undefined}>
			<Box>
				<Flex gap='8' overflow='hidden' my='4'>
					<Box flex='1' overflow='hidden'>
						<ConnectivityMap
							data={myData}
							type='node'
							backgroundColor='white'
							onSelectNode={(id) => setSelectedNode(id)}
							size={5}
						/>
					</Box>
					<Box flex='1' overflow='hidden'>
						<ConnectivityMap
							data={myData}
							backgroundColor='white'
							onSelectLink={() => console.log('link selected')}
							type='link'
							size={5}
						/>
					</Box>
				</Flex>
				{selectedNode}
			</Box>
		</Skeleton>
	);
};

export default QubitVisualization;
