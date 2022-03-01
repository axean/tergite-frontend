import { Flex, Box } from '@chakra-ui/react';
import CardStatus from '../components/CardStatus';
import Filter from '../components/Filter';
import GridBackends from '../components/GridBackends';
import SearchBar from '../components/Searchbar';
import Sort from '../components/Sort';
import { WacqtInfoCard } from '../components/WacqtInfoCard';

const Index = () => (
	<>
		<Flex gap='8' my='8' height='max-content'>
			<Box flex='1'>
				<WacqtInfoCard />
			</Box>
			<Box flex='1'>
				<CardStatus />
			</Box>
		</Flex>
		<Flex justify='space-between' mb='4'>
			<SearchBar />
			<Flex gap='4'>
				<Sort />
				<Filter />
			</Flex>
		</Flex>
		<GridBackends />
	</>
);

export default Index;
