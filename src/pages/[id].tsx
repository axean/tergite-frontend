import { Box, Button, Flex, Icon, Text } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React, { useContext, useEffect, useState } from 'react';
import { MdFirstPage, MdLastPage } from 'react-icons/md';
import { useQuery } from 'react-query';
import { SmallConnectivityMap } from '../components/connectivityMap/ConnectivityMap';
import { HistogramVisualization } from '../components/visualizations/HistogramVisualization';
import NavbarVisualizations from '../components/NavbarVisualizations';
import QubitVisualization from '../components/visualizations/QubitVisualization';
import BoxPlot from '../components/boxPlot/BoxPlot';
import { GateErrorVisualization } from '../components/visualizations/GateErrorVisualization';
import { useAllLayouts, useSelectionMaps } from '../state/BackendContext';
import { facadeDeviceDetail } from '../utils/facade';
import LineChartVisualization from '../components/visualizations/LineChartVisualization';

type VisualizationRoutes =
	| 'Qubitmap'
	| 'Histogram'
	| 'Boxplot'
	| 'Linegraph'
	| 'Tableview'
	| 'Cityplot';

const Detail = ({ id, type }) => {
	const [isCollapsed, setCollapsed] = useState(false);
	const { isLoading, error, data } = useQuery<API.Response.DeviceDetail>('DetailPageEEEE', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/pingu').then((res) => res.json())
	);
	const { deviceLayouts, setDeviceLayouts } = useAllLayouts();
	useEffect(() => {
		if (!isLoading && data !== undefined) {
			setDeviceLayouts(facadeDeviceDetail(data));
		}
		// eslint-disable-next-line
	}, [isLoading, data]);

	if (isLoading) {
		return <Text>Loading...</Text>;
	}
	if (error && data !== undefined) {
		return <Text>Loading...</Text>;
	}

	return (
		<Flex flex='1' py='8' w='full' id='deailId'>
			<Flex gap='8' flex='1'>
				<SidePanel
					isCollapsed={isCollapsed}
					setCollapsed={setCollapsed}
					MdFirstPage={MdFirstPage}
					backend={id}
					type={type}
				/>
				<Flex flexDir='column' bg='white' flex='5' p='4' borderRadius='md' boxShadow='lg'>
					<NavbarVisualizations
						isCollapsed={isCollapsed}
						onToggleCollapse={() => setCollapsed(!isCollapsed)}
					/>
					<VisualizationPanel isCollapsed={isCollapsed} type={type} />
				</Flex>
			</Flex>
		</Flex>
	);
};

const VisualizationPanel = ({ isCollapsed, type }) => {
	const router = useRouter();
	const { id } = router.query;

	switch (type) {
		case 'Qubitmap':
			return <QubitVisualization isCollapsed={isCollapsed} />;
		case 'Histogram':
			return <HistogramVisualization backend={id} />;
		case 'Boxplot':
			return <GateErrorVisualization backend={id} />;
		case 'Linegraph':
			return <LineChartVisualization backend={id} />;
		case 'Tableview':
			return <>Tableview</>;
		case 'Cityplot':
			return <>Cityplot</>;
		default:
			return <QubitVisualization isCollapsed={isCollapsed} />;
	}
};

Detail.getInitialProps = async (ctx) => {
	const id = await ctx.query.id;
	const type = await ctx.query.type;

	return {
		id,
		type
	};
};

export default Detail;

function SidePanel({ isCollapsed, setCollapsed, MdFirstPage, backend, type }) {
	const showMap = type !== undefined && type !== 'Qubitmap' && type !=='Boxplot' && type !== 'Linegraph' && type !== 'Tableview';
	const { isLoading, data, error } = useQuery<API.Response.DeviceDetail>('backendDetail', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/' + backend).then((res) =>
			res.json()
		)
	);

	const { showLinkSelectorMap, showNodeSelectorMap } = useSelectionMaps();
	if (isLoading || error) return '';

	return (
		!isCollapsed && (
			<Flex
				flexDir='column'
				bg='white'
				flex='2'
				p='4'
				py='6'
				borderRadius='md'
				boxShadow='lg'
			>
				{showMap ? (
					<Flex flexDir='column' alignItems='center'>
						{showNodeSelectorMap && (
							<Box w={{ xl: '90%', '2xl': '80%' }}>
								<SmallConnectivityMap
									backgroundColor='white'
									type='node'
									size={5}
								/>
							</Box>
						)}
						{showLinkSelectorMap && (
							<Box w={{ xl: '90%', '2xl': '80%' }}>
								<SmallConnectivityMap
									backgroundColor='white'
									type='link'
									size={5}
								/>
							</Box>
						)}
					</Flex>
				) : (
					<Box pl='2'>
						<Flex px={0} justifyContent='space-between'>
							<BackendInfo {...data} />

							<Button ml='5' p='1' onClick={() => setCollapsed(!isCollapsed)}>
								<Icon as={MdFirstPage} w={8} h={8} />
							</Button>
						</Flex>
						<Text fontSize='2xl' fontWeight='bold' color='black' mt='10'>
							Description
						</Text>
						<Text fontSize='lg' color='black'>
							{data.description}
						</Text>
					</Box>
				)}
			</Flex>
		)
	);
}

type BackendInfoProps = Omit<
	API.Response.DeviceDetail,
	'resonators' | 'couplers' | 'qubits' | 'gates'
>;

const BackendInfo: React.FC<BackendInfoProps> = ({
	backend_name,
	backend_version,
	n_qubits,
	is_online,
	last_update_date,
	online_date,
	sample_name
}) => {
	return (
		<Box
			bg={is_online ? 'white' : 'gray.100'}
			borderRadius='md'
			color={is_online ? 'black' : 'gray.500'}
			flex='1'
		>
			<Flex justify='space-between'>
				{' '}
				<Text fontSize='2xl' fontWeight='extrabold'>
					{' '}
					{backend_name}
				</Text>{' '}
				<Flex align='center'>
					<Text fontSize='sm' mr='2'>
						{is_online ? 'online' : 'offline'}{' '}
					</Text>
					<Box
						display='inline-block'
						w='4'
						h='4'
						bg={is_online ? 'green.400' : 'red.400'}
						borderRadius='full'
					></Box>
				</Flex>
			</Flex>
			<Flex mt='2'>
				<Text fontSize='md' fontWeight='regular' mr='2'>
					version:
				</Text>
				<Text fontWeight='bold'>{backend_version}</Text>
			</Flex>
			<Flex>
				<Text fontSize='md' fontWeight='regular' mr='2'>
					qubits:
				</Text>
				<Text fontWeight='bold'>{n_qubits}</Text>
			</Flex>
			<Flex>
				<Text fontSize='md' fontWeight='regular' mr='2'>
					last update:
				</Text>
				<Text fontWeight='bold'>{last_update_date?.split('T')[0]}</Text>
			</Flex>
			<Flex>
				<Text fontSize='md' fontWeight='regular' mr='2'>
					sample name:
				</Text>
				<Text fontWeight='bold'>{sample_name}</Text>
			</Flex>
			<Text fontWeight='bold' fontSize='sm' mt='2' color={is_online ? 'gray.700' : 'inherit'}>
				{' '}
				{is_online ? `Online since` : `Offline since`}
			</Text>
			<Text fontWeight='bold'>
				{is_online ? online_date.split('T')[0] : last_update_date.split('T')[0]}
			</Text>
		</Box>
	);
};
