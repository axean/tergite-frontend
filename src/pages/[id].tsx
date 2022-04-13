import { Box, Button, Flex, Icon, Text } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import { MdFirstPage, MdLastPage } from 'react-icons/md';
import NavbarVisualizations from '../components/NavbarVisualizations';
import QubitVisualization from '../components/visualizations/QubitVisualization';
import CardBackend from '../components/CardBackend';
import { useQuery } from 'react-query';

type VisualizationRoutes =
	| 'Qubitmap'
	| 'Histogram'
	| 'Graphdeviation'
	| 'Linegraph'
	| 'Tableview'
	| 'Cityplot';

const Detail = ({ id, type }) => {
	const [isCollapsed, setCollapsed] = useState(false);
	return (
		<Flex flex='1' py='8' w='full' id='deailId'>
			<Flex gap='8' flex='1'>
				<SidePanel
					isCollapsed={isCollapsed}
					setCollapsed={setCollapsed}
					MdFirstPage={MdFirstPage}
					backend={id}
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

	switch (type) {
		case 'Qubitmap':
			return <QubitVisualization isCollapsed={isCollapsed} />;
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
			return <QubitVisualization isCollapsed={isCollapsed} />;
	}
};

Detail.getInitialProps = async (ctx) => {
    const id = await ctx.query.id;
	const type = await ctx.query.type;

	return {
        id,
		type
    }
  }


export default Detail;

function SidePanel({ isCollapsed, setCollapsed, MdFirstPage, backend }) {

	const { isLoading, data, error } = useQuery('backendDetail', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/'+backend).then((res) => res.json())
	);

	if (isLoading || error) return '';

	return (
		!isCollapsed && (
			<Box bg='white' p='4' py='6' borderRadius='md' boxShadow='lg'>
				<Flex px={0} justifyContent='space-between'>
					<CardBackend {...data}/>
					<Button ml="5" p='1' onClick={() => setCollapsed(!isCollapsed)}>
						<Icon as={MdFirstPage} w={8} h={8} />	
					</Button>
				</Flex>
				<Text fontSize='3xl' color='black' mt="10">
					Description
				</Text>
				<Text fontSize="lg" color="black">
					{data.description}
				</Text>
			</Box>
		)
	);
}