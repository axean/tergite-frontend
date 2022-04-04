import { Flex, Box } from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import CardStatus from '../components/CardStatus';
import Filter from '../components/Filter';
import SearchBar from '../components/Searchbar';
import Sort from '../components/Sort';
import { WacqtInfoCard } from '../components/WacqtInfoCard';
import { QueryClient, QueryClientProvider, useQuery } from 'react-query';
import { CardBackendProps } from '../components/CardBackend';
import GridBackends, { GridBackendsProps } from '../components/GridBackends';

const Index = () => {
	const [search, setSearch] = useState('');
	const [sort, setSort] = useState({ order: 'asc', option: 'name' });
	const [filter, setFilter] = useState(['online', 'offline']);
	// Just use setBackends and data when backend fixed the cors errors
	const { isLoading, data, error } = useQuery('backendOverview', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/').then((res) => res.json())
	);

	if (isLoading) return 'Loading...';

	if (error) return 'Error, prob no devices found';

	console.log(data);

	function filterParser(data): string {
		return data.is_online ? 'online' : 'offline'
	}

	const sortedBackends = useMemo(() => {
		let filtered = data.filter((backend) => filter.includes(filterParser(backend)));

		let regex;
		if (search.split('').length === 0) {
			regex = new RegExp('^' + search, 'i');
		} else {
			regex = new RegExp(search, 'i');
		}

		filtered = filtered.filter(({ name }) => regex.test(name));
		if (sort.order === 'asc') {
			return filtered.sort((a, b) => a[sort.option].localeCompare(b[sort.option]));
		} else {
			return filtered.sort((a, b) => b[sort.option].localeCompare(a[sort.option]));
		}
	}, [search, sort.order, sort.option, data, filter]);

	return (
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
				<SearchBar search={search} setSearch={setSearch} />
				<Flex gap='4'>
					<Sort sort={sort} setSort={setSort} />
					<Filter filter={filter} setFilter={setFilter} />
				</Flex>
			</Flex>
			<GridBackends backends={sortedBackends} />
		</>
	);
};

export default Index;
