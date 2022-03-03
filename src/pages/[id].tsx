import React from 'react';
import { useRouter } from 'next/router';
import { Box, Flex, Grid, GridItem, SimpleGrid, Text } from '@chakra-ui/react';
import GridBackends from '../components/GridBackends';
import CardStatus from '../components/CardStatus';
import Filter from '../components/Filter';
import SearchBar from '../components/Searchbar';
import Sort from '../components/Sort';
import { WacqtInfoCard } from '../components/WacqtInfoCard';
const Detail = () => {
	const router = useRouter();
	const id = router.query.id;
	return (
		<Flex flex='1' py='8' w='full' id='deailId'>
			<Grid templateColumns='1fr 1fr' templateRows='1fr 1fr' gap='8' flex='1'>
				<GridItem rowStart={1} w='100%' h='100%' bg='gray.800'>
					<Text fontSize='4xl' color='white'>
						quantum computer information
					</Text>
				</GridItem>
				<GridItem rowStart={2} w='100%' h='100%' bg='gray.800'>
					<Text fontSize='4xl' color='white'>
						description
					</Text>
				</GridItem>
				<GridItem rowSpan={2} w='100%' h='100%' bg='gray.800'>
					<Text fontSize='4xl' color='white'>
						charts
					</Text>
				</GridItem>
			</Grid>
		</Flex>
	);
};

export default Detail;
