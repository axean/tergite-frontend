import {
	Flex,
	Box,
	Spinner,
	Grid,
	Skeleton,
	Menu,
	MenuButton,
	MenuItem,
	Text,
	MenuList,
	Select,
	Button
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useContext, useEffect, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { BackendContext, MapActions } from '../../state/BackendContext';
import facade from '../../utils/facade';
import ConnectivityMap from '../connectivityMap/';
import RadioButtons from '../RadioButtons';

type QubitVisualizationProps = {
	isCollapsed: boolean;
};
const QubitVisualization: React.FC<QubitVisualizationProps> = ({ isCollapsed }) => {
	const { isLoading, error, data } = useQuery('QubitVisualization', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/pingu').then((res) => res.json())
	);

	const type1 = useQuery('QubitVisualizationType1', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/pingu/type1').then((res) =>
			res.json()
		)
	);

	const [{ selectedNode, nodes, links, nodeType, linkType }, dispatch] =
		useContext(BackendContext);
	const rerenderRef = useRef(isCollapsed);
	const [isRerendering, setIsRerendering] = useState(false);
	const [facadeData, setFacadeData] = useState(undefined);
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
		if (data && type1.data) {
			setFacadeData(facade(type1.data, 'type1', facade(data, 'root')));
		}
	}, [isLoading, error, type1.isLoading, type1.error, type1.data]); // eslint-disable-line
	useEffect(() => {
		if (facadeData) {
			let f = facade(data, 'root');
			console.log('6969: ', f);
			dispatch({ type: MapActions.SET_NODES, payload: f.nodes });
			dispatch({
				type: MapActions.SET_LINKS,
				payload: f.links
			});
		}
	}, [facadeData]); // eslint-disable-line

	const router = useRouter();

	const [nodeProp, setNodeProp] = useState('');
	const [linkProp, setLinkProp] = useState('');

	if (isLoading || type1.isLoading || facadeData === undefined)
		return (
			<Flex flex='1' gap='8'>
				<Flex flex='1' gap='8' flexDir='column'>
					<Skeleton flex='3' w='100%'></Skeleton>
					<Skeleton flex='1' w='100%'></Skeleton>
				</Flex>
				<Flex flex='1' gap='8' flexDir='column'>
					<Skeleton flex='3' w='100%'></Skeleton>
					<Skeleton flex='1' w='100%'></Skeleton>
				</Flex>
			</Flex>
		);

	return (
		<Skeleton isLoaded={!isRerendering}>
			<Box>
				<Flex gap='8' overflow='hidden' my='4'>
					<Box overflow='hidden' flex='1'>
						<ConnectivityMap
							layout={{ nodes, links }}
							data={{
								values: facadeData.nodes,
								component: nodeType,
								property: nodeProp
							}}
							type='node'
							backgroundColor='white'
							onSelect={() => {
								router.push(`${router.query.id}?type=Histogram`);
							}}
							size={5}
						/>
					</Box>
					<Box overflow='hidden' flex='1'>
						<ConnectivityMap
							layout={{ nodes, links }}
							component={nodeType}
							property={nodeProp}
							data={{
								values: facadeData.nodes,
								component: nodeType,
								property: nodeProp
							}}
							backgroundColor='white'
							onSelect={() => {
								router.push(`${router.query.id}?type=Graphdeviation`);
							}}
							type='node'
							size={5}
						/>
					</Box>
				</Flex>
				<Flex gap='8'>
					<Selections
						facadeData={facadeData}
						type='node'
						onChange={(e) => {
							console.log('facadeData');

							setNodeProp(e);
						}}
					/>
					<Selections
						facadeData={facadeData}
						type='link'
						onChange={(e) => setLinkProp(e)}
					/>
				</Flex>
			</Box>
		</Skeleton>
	);
};

export default QubitVisualization;

function Selections({ facadeData, type, onChange }) {
	const [{ nodeType, linkType }, dispatch] = useContext(BackendContext);
	const selectionType = type === 'node' ? nodeType : linkType;
	const data = type === 'node' ? facadeData.nodes : facadeData.links;

	const defaultValue = Object.keys(data[selectionType][0])[0];

	const [selected, setSelected] = useState(defaultValue);

	useEffect(() => {
		dispatch({
			type: type === 'node' ? MapActions.SET_NODE_TYPE : MapActions.SET_LINK_TYPE,
			payload: Object.keys(data)[0]
		});
		console.log('defaultValue', defaultValue);
		onChange(defaultValue);
	}, []);

	return (
		<Box flex='1'>
			<RadioButtons
				tabs={Object.keys(data)}
				setTab={(value) => {
					dispatch({
						type: type === 'node' ? MapActions.SET_NODE_TYPE : MapActions.SET_LINK_TYPE,
						payload: value
					});
				}}
			/>
			<Text fontSize='md' fontWeight='bold'>
				{type === 'node' ? 'Property:' : 'Connection property:'}
			</Text>

			<Select
				defaultValue={defaultValue}
				value={selected}
				onChange={(e) => {
					setSelected(e.target.value);
					onChange(e.target.value);
				}}
			>
				{Object.keys(data[selectionType][0]).map((key, index) => (
					<option key={index}> {key} </option>
				))}
			</Select>
		</Box>
	);
}
