import { Flex, Box, Spinner, Grid, Skeleton } from '@chakra-ui/react';
import { useContext, useEffect, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { BackendContext, MapActions } from '../../state/BackendContext';
import ConnectivityMap from '../connectivityMap/';

type QubitVisualizationProps = {
	isCollapsed: boolean;
};
const QubitVisualization: React.FC<QubitVisualizationProps> = ({ isCollapsed }) => {
	const { isLoading, error, data } = useQuery('QubitVisualization', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/pingu').then((res) => res.json())
	);

	const [{ selectedNode, nodes, links }, dispatch] = useContext(BackendContext);
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

	useEffect(() => {
		if (data) {
			dispatch({ type: MapActions.SET_NODES, payload: data.qubits });
			dispatch({
				type: MapActions.SET_LINKS,
				payload: data.couplers
			});
			console.log('new links ', links);
		}
	}, [data]);

	const myData = {
		nodes,
		links
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
							size={5}
						/>
					</Box>
					<Box flex='1' overflow='hidden'>
						<ConnectivityMap
							data={myData}
							backgroundColor='white'
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
