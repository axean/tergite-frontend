import { Box, Button, Flex, Icon, Text } from '@chakra-ui/react';
import { ParentSize } from '@visx/responsive';
import { useRouter } from 'next/router';
import React, { useContext, useState } from 'react';
import { MdFirstPage, MdLastPage } from 'react-icons/md';
import { useQuery } from 'react-query';
import ConnectivityMap from '../components/connectivityMap';
import { SmallConnectivityMap } from '../components/connectivityMap/ConnectivityMap';
import { HistogramVisualization } from '../components/visualizations/HistogramVisualization';
import NavbarVisualizations from '../components/NavbarVisualizations';
import LineChart from '../components/lineChart/LineChart';
import QubitVisualization from '../components/visualizations/QubitVisualization';
import LineChartVisualization from '../components/visualizations/LineChartVisualization';

type VisualizationRoutes =
	| 'Qubitmap'
	| 'Histogram'
	| 'Graphdeviation'
	| 'Linegraph'
	| 'Tableview'
	| 'Cityplot';

const Detail = () => {
	const [isCollapsed, setCollapsed] = useState(false);
	const { isLoading, error, data } = useQuery('DetailPageEEEE', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/pingu').then((res) => res.json())
	);

	if (isLoading) {
		return <Text>Loading...</Text>;
	}
	if (error && data !== undefined) {
		return <Text>Loading...</Text>;
	}

	return (
		<Flex flex='1' py='8' w='full' id='deailId'>
			<Flex gap='8' flex='1'>
				<SidePanel isCollapsed={isCollapsed} setCollapsed={setCollapsed} data={data} />
				<Flex flexDir='column' bg='white' flex='5' p='4' borderRadius='md' boxShadow='lg'>
					<NavbarVisualizations
						isCollapsed={isCollapsed}
						onToggleCollapse={() => setCollapsed(!isCollapsed)}
					/>
					<VisualizationPanel isCollapsed={isCollapsed} />
				</Flex>
			</Flex>
		</Flex>
	);
};

const VisualizationPanel = ({ isCollapsed }) => {
	const router = useRouter();
	const { id } = router.query;
	const type = router.query.type as VisualizationRoutes;
	switch (type) {
		case 'Qubitmap':
			return <QubitVisualization isCollapsed={isCollapsed} />;
		case 'Histogram':
			return <HistogramVisualization backend={id} />;
		case 'Graphdeviation':
			return <>Graphdeviation</>;
		case 'Linegraph':
			return <LineChartVisualization />;
		case 'Tableview':
			return <>Tableview</>;
		case 'Cityplot':
			return <>Cityplot</>;
		default:
			return <QubitVisualization isCollapsed={isCollapsed} />;
	}
};

export default Detail;

function SidePanel({ isCollapsed, setCollapsed, data }) {
	const router = useRouter();
	const type = router.query.type as VisualizationRoutes;
	const showMap = type !== undefined && type !== 'Qubitmap';
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
				<Flex justifyContent='space-between'>
					<Text fontSize='2xl' color='black'>
						Chalmers Luki
					</Text>
					<Button p='2' onClick={() => setCollapsed(!isCollapsed)}>
						<Icon as={MdFirstPage} w={8} h={8} />
					</Button>
				</Flex>
				{/* <Text fontSize='4xl' color='black'>
					description
				</Text> */}
				{showMap && (
					<Flex flexDir='column' alignItems='center'>
						<Box w={{ xl: '90%', '2xl': '80%' }}>
							<SmallConnectivityMap
								data={{ nodes: data.qubits, links: [] }}
								backgroundColor='white'
								type='node'
								size={5}
							/>
						</Box>
					</Flex>
				)}
			</Flex>
		)
	);
}
