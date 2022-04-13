import { Flex, Box, Spinner, Grid, Skeleton } from '@chakra-ui/react';
import { useContext, useEffect, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { BackendContext, MapActions } from '../../state/BackendContext';
import ConnectivityMap from '../connectivityMap/';
import RadioButtons from '../RadioButtons';

type QubitVisualizationProps = {
	isCollapsed: boolean;
};
const QubitVisualization: React.FC<QubitVisualizationProps> = ({ isCollapsed }) => {
	const { isLoading, error, data } = useQuery('QubitVisualization', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/pingu').then((res) => res.json())
	);

	const [{ selectedNode, nodes, links, nodeType, linkType }, dispatch] =
		useContext(BackendContext);
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
		}
	}, [data]); // eslint-disable-line

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
				<Flex gap='8'>
					<Box flex='1'>
						{/* <RadioButtons
							tabs={['Qubits', 'Resonators', '1QB Gates']}
							setTab={(value) => {
								dispatch({ type: MapActions.SET_NODE_TYPE, payload: value });
							}}
						/> */}
						Property:
					</Box>
					<Box flex='1'>
						{/* <RadioButtons
							tabs={['Couplers', '2QB Gates']}
							setTab={(value) => {
								dispatch({ type: MapActions.SET_LINK_TYPE, payload: value });
							}}
						/> */}
						Connection property:
					</Box>
				</Flex>
			</Box>
		</Skeleton>
	);
};

export default QubitVisualization;
