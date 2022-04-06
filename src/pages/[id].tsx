import { Box, Button, Flex, Icon, Text } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { MdFirstPage, MdLastPage } from 'react-icons/md';
import NavbarVisualizations from '../components/NavbarVisualizations';

type VisualizationRoutes =
	| 'Qubitmap'
	| 'Histogram'
	| 'Graphdeviation'
	| 'Linegraph'
	| 'Tableview'
	| 'Cityplot';

const Detail = () => {
	const [isCollapsed, setCollapsed] = useState(false);
	return (
		<Flex flex='1' py='8' w='full' id='deailId'>
			<Flex gap='8' flex='1'>
				<SidePanel
					isCollapsed={isCollapsed}
					setCollapsed={setCollapsed}
					MdFirstPage={MdFirstPage}
				/>
				<Box bg='white' flex='5' p='4' borderRadius='md' boxShadow='lg'>
					<NavbarVisualizations
						isCollapsed={isCollapsed}
						onToggleCollapse={() => setCollapsed(!isCollapsed)}
					/>
					<VisualizationPanel />
				</Box>
			</Flex>
		</Flex>
	);
};

const VisualizationPanel = () => {
	const router = useRouter();
	const type = router.query.type as VisualizationRoutes;
	switch (type) {
		case 'Qubitmap':
			return <>qubit</>;
		case 'Histogram':
			return <>histogram</>;
		case 'Graphdeviation':
			return <>Graphdeviation</>;
		case 'Linegraph':
			return <>Linegraph</>;
		case 'Tableview':
			return <>Tableview</>;
		case 'Cityplot':
			return <>Cityplot</>;
		default:
			return <div>No visualization</div>;
	}
};

export default Detail;

function SidePanel({ isCollapsed, setCollapsed, MdFirstPage }) {
	return (
		!isCollapsed && (
			<Box bg='white' flex='2' p='4' py='6' borderRadius='md' boxShadow='lg'>
				<Flex justifyContent='space-between'>
					<Text fontSize='2xl' color='black'>
						Chalmers Luki
					</Text>
					<Button p='2' onClick={() => setCollapsed(!isCollapsed)}>
						<Icon as={MdFirstPage} w={8} h={8} />
					</Button>
				</Flex>
				<Text fontSize='4xl' color='black'>
					description
				</Text>
			</Box>
		)
	);
}
