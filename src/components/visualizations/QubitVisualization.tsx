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
import {
	BackendContext,
	MapActions,
	useAllLayouts,
	useMapData,
	useSelectedComponentLayout
} from '../../state/BackendContext';
import { facadeType1 } from '../../utils/facade';
import ConnectivityMap from '../connectivityMap/';
import RadioButtons from '../RadioButtons';

type QubitVisualizationProps = {
	isCollapsed: boolean;
};
const QubitVisualization: React.FC<QubitVisualizationProps> = ({ isCollapsed }) => {
	const { isLoading, error, data } = useQuery<API.Response.Type1>('QubitVisualizationType1', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/pingu/type1').then((res) =>
			res.json()
		)
	);
	const { deviceLayouts } = useAllLayouts();
	const rerenderRef = useRef(isCollapsed);
	const [isRerendering, setIsRerendering] = useState(false);
	const { allData, setMapData } = useMapData();
	const [{ nodeProperty }, dispatch] = useContext(BackendContext);
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

	// console.log('from qubitviz', deviceLayouts);
	console.log('from qubit viz:', nodeProperty);

	useEffect(() => {
		if (data && deviceLayouts && deviceLayouts.nodeLayouts && deviceLayouts.linkLayouts) {
			setMapData(facadeType1(data, deviceLayouts));
		}
	}, [isLoading, error, data]); // eslint-disable-line

	if (isLoading || allData === null)
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
							type='node'
							backgroundColor='white'
							onSelect={() => {
								// router.push(`${router.query.id}?type=Histogram`);
							}}
							size={5}
						/>
					</Box>
					<Box overflow='hidden' flex='1'>
						<ConnectivityMap
							backgroundColor='white'
							onSelect={() => {
								// router.push(`${router.query.id}?type=Graphdeviation`);
							}}
							type='node'
							size={5}
						/>
					</Box>
				</Flex>
				<Flex gap='8'>
					<Selections
						facadeData={allData}
						type='node'
						onChange={(e) => {
							console.log('onchage:', e);
							dispatch({
								type: MapActions.SET_NODE_PROPERTY,
								payload: e
							});
						}}
					/>
					<div>{nodeProperty} </div>
					{/* <Selections
						facadeData={facadeData}
						type='link'
						onChange={(e) => setLinkProp(e)}
					/> */}
				</Flex>
			</Box>
		</Skeleton>
	);
};

export default QubitVisualization;

function Selections({ facadeData, type: selectType, onChange }) {
	const [{ nodeComponent: nodeType, linkComponent: linkType }, dispatch] =
		useContext(BackendContext);
	const selectionType = selectType === 'node' ? nodeType : linkType;
	const data = selectType === 'node' ? facadeData.nodes : facadeData.links;

	const defaultValue = Object.keys(data[selectionType][0])[0];

	// useEffect(() => {
	// 	dispatch({
	// 		type: type === 'node' ? MapActions.SET_NODE_TYPE : MapActions.SET_LINK_TYPE,
	// 		payload: Object.keys(data)[0]
	// 	});
	// 	console.log('defaultValue', defaultValue);
	// 	onChange(defaultValue);
	// }, []);
	return (
		<Box flex='1'>
			<RadioButtons
				tabs={Object.keys(data)}
				setTab={(value) => {
					dispatch({
						type:
							selectType === 'node'
								? MapActions.SET_NODE_COMPONENT
								: MapActions.SET_LINK_COMPONENT,
						payload: value as Application.NodeKeys | Application.LinkKeys
					});
				}}
			/>
			<Text fontSize='md' fontWeight='bold'>
				{selectType === 'node' ? 'Property:' : 'Connection property:'}
			</Text>

			<Select
				defaultValue={defaultValue}
				onChange={(e) => {
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
