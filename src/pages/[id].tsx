import React from 'react';
import { useRouter } from 'next/router';
import { Box, Flex, Grid, GridItem, SimpleGrid, Text } from '@chakra-ui/react';
import GridBackends from '../components/GridBackends';
import CardStatus from '../components/CardStatus';
import Filter from '../components/Filter';
import SearchBar from '../components/Searchbar';
import Sort from '../components/Sort';
import { WacqtInfoCard } from '../components/WacqtInfoCard';
import ConnectivityMap from '../components/ConnectivityMap';
const Detail = () => {
	const router = useRouter();
	const id = router.query.id;

	const nodes = [
		{ x: 0, y: 0 },
		{ x: 1, y: 1 },
		{ x: 2, y: 2 }
	];

	const dataSample = {
		nodes,
		links: [
			{ source: nodes[0], target: nodes[1] },
			{ source: nodes[1], target: nodes[2] },
			{ source: nodes[2], target: nodes[0] }
		]
	};
	return (
		<Flex flex='1' py='8' w='full' id='deailId'>
			<Flex gap='8' flex='1'>
				<Box bg='white' flex='2' p='2' borderRadius='md' boxShadow='lg'>
					<Flex justifyContent='space-between'>
						<Text fontSize='2xl' color='black'>
							Chalmers Luki
						</Text>
					</Flex>
					<Text fontSize='4xl' color='black'>
						description
					</Text>
				</Box>

				<Box bg='white' flex='5' p='4' borderRadius='md' boxShadow='lg'>
					<Flex flex={1} h='full' gap='4'>
						<ConnectivityMap data={dataSample} backgroundColor='#34eb43' />
						<ConnectivityMap data={dataSample} backgroundColor='#eb4034' />
					</Flex>
				</Box>
			</Flex>
		</Flex>
	);
};

export default Detail;
