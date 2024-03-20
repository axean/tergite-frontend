import { Box, Flex, Skeleton } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { useAllLayouts, useMapData, useSelectionMaps } from '@/state/BackendContext';
import { facadeType1 } from '@/utils/facade';
import ConnectivityMap from './components/ConnectivityMap';
import MapSelections from './components/MapSelections';
import { getType1DeviceData } from '@/utils/api';

export default function QubitTab({ isCollapsed }: Props) {
	const router = useRouter();
	const { isLoading, error, data } = useQuery<API.Response.Type1>('QubitVisualizationType1', () =>
		getType1DeviceData(`${router.query.id}/type1`)
	);
	const { deviceLayouts } = useAllLayouts();
	const rerenderRef = useRef(isCollapsed);
	const [isRerendering, setIsRerendering] = useState(false);
	const { allData, setMapData } = useMapData();
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
}

interface Props {
	isCollapsed: boolean;
}
