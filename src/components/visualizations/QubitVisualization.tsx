import { Box, Flex, Select, Skeleton, Text } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import {
	BackendContext,
	MapActions,
	useAllLayouts,
	useMapData,
	useSelectionMaps
} from '../../state/BackendContext';
import { facadeType1 } from '../../utils/facade';
import ConnectivityMap from '../connectivityMap/';
import RadioButtons from '../RadioButtons';
import ApiRoutes from '../../utils/ApiRoutes';

type QubitVisualizationProps = {
	isCollapsed: boolean;
};
const QubitVisualization: React.FC<QubitVisualizationProps> = ({ isCollapsed }) => {
	const router = useRouter();
	const { isLoading, error, data } = useQuery<API.Response.Type1>('QubitVisualizationType1', () =>
		fetch(`${ApiRoutes.devices}/${router.query.id}/type1`).then((res) => res.json())
	);
	const { deviceLayouts } = useAllLayouts();
	const rerenderRef = useRef(isCollapsed);
	const [isRerendering, setIsRerendering] = useState(false);
	const { allData, setMapData } = useMapData();
	const [{ nodeProperty }, dispatch] = useContext(BackendContext);
	const { setSelectionMap } = useSelectionMaps();

	// this is needed due to rendering issues
	useEffect(() => {
		if (rerenderRef.current !== isCollapsed) {
			rerenderRef.current = isCollapsed;
			setIsRerendering(true);
			setTimeout(() => {
				setIsRerendering(false);
			}, 50);
		}
	}, [isCollapsed]);

	useLayoutEffect(() => {
		if (data && deviceLayouts && deviceLayouts.nodeLayouts && deviceLayouts.linkLayouts) {
			setSelectionMap(false, false);
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
								router.push(`${router.query.id}?type=Histogram`);
							}}
							size={5}
						/>
					</Box>
					<Box overflow='hidden' flex='1'>
						<ConnectivityMap
							backgroundColor='white'
							onSelect={() => {
								router.push(`${router.query.id}?type=Graphdeviation`);
							}}
							type='link'
							size={5}
						/>
					</Box>
				</Flex>
				<Flex gap='8'>
					<MapSelections selectType='node' />
					<MapSelections selectType='link' />
				</Flex>
			</Box>
		</Skeleton>
	);
};

export default QubitVisualization;

type MapSelectionsProps = {
	selectType: 'node' | 'link';
};

const MapSelections: React.FC<MapSelectionsProps> = ({ selectType }) => {
	const { allData } = useMapData();
	const [{ nodeComponent, linkComponent, linkProperty, nodeProperty }, dispatch] =
		useContext(BackendContext);

	const selectionType = selectType === 'node' ? nodeComponent : linkComponent;
	const data = selectType === 'node' ? allData.nodes : allData.links;
	const defaultValue = selectType === 'node' ? nodeProperty : linkProperty;

	return (
		<Box flex='1'>
			<RadioButtons
				dataAttribute={selectType}
				tabs={Object.keys(data)}
				defaultTab={selectionType}
				setTab={(value) => {
					dispatch({
						type:
							selectType === 'node'
								? MapActions.SET_NODE_COMPONENT
								: MapActions.SET_LINK_COMPONENT,
						payload: value as any
					});
				}}
			/>
			<Text fontSize='md' fontWeight='bold'>
				{selectType === 'node' ? 'Property:' : 'Connection property:'}
			</Text>

			<Select
				id='selectItem'
				defaultValue={defaultValue}
				data-cy-dropdown={selectType}
				onChange={(e) => {
					console.log('onchange', e);
					dispatch({
						type:
							selectType === 'node'
								? MapActions.SET_NODE_PROPERTY
								: MapActions.SET_LINK_PROPERTY,
						payload: e.target.value as any
					});
				}}
			>
				{Object.keys(data[selectionType][0]).map((key, index) => (
					<option key={index}> {key} </option>
				))}
			</Select>
		</Box>
	);
};
