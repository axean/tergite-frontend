import { Flex, Box } from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import CardStatus from '../components/CardStatus';
import Filter from '../components/Filter';
import SearchBar from '../components/Searchbar';
import Sort from '../components/Sort';
import { WacqtInfoCard } from '../components/WacqtInfoCard';
import { useQuery } from 'react-query';
import GridBackends from '../components/GridBackends';

const Index = () => {
	// Just use setBackends and data when backend fixed the cors errors
	const { isLoading, data, error } = useQuery<API.Response.Devices>('backendOverview', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/').then((res) => res.json())
	);

	const [search, setSearch] = useState('');
	const [sort, setSort] = useState({ order: 'asc', option: 'backend_name' });
	const [filter, setFilter] = useState(['online', 'offline']);
	function filterParser(data: API.Device): string {
		return data.is_online ? 'online' : 'offline';
	}

	const sortedBackends = useMemo(() => {
		if (isLoading || error || !data) return [];

		let filtered = data.filter((backend) => filter.includes(filterParser(backend)));
		let regex;
		if (search.split('').length === 0) {
			regex = new RegExp('^' + search, 'i');
		} else {
			regex = new RegExp(search, 'i');
		}
		console.log('filtered before', filtered);
		filtered = filtered.filter(({ backend_name }) => regex.test(backend_name));
		console.log('filtered after', filtered);
		if (sort.order === 'asc') {
			console.log('sort option', filtered[0][sort.option]);
			return filtered.sort((a, b) => a[sort.option].toString().localeCompare(b[sort.option]));
		} else {
			return filtered.sort((a, b) => b[sort.option].toString().localeCompare(a[sort.option]));
		}
	}, [search, sort.order, sort.option, data, filter, isLoading, error]);

	if (isLoading) return 'Loading...';

	if (error) return 'Error, prob no devices found';
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
