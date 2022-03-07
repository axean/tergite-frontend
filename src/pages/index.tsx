import { Flex, Box } from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import CardStatus from '../components/CardStatus';
import Filter from '../components/Filter';
import GridBackends, { CardBackendProps, GridBackendsProps } from '../components/GridBackends';
import SearchBar from '../components/Searchbar';
import Sort from '../components/Sort';
import { WacqtInfoCard } from '../components/WacqtInfoCard';

const Index = () => {
	const [search, setSearch] = useState('');
	const [sort, setSort] = useState({ order: 'asc', option: 'name' });
	const [filter, setFilter] = useState(['online', 'offline']);

	const [backends, setBackends] = useState<CardBackendProps[]>([
		{
			name: 'IBMQ Santiago',
			version: '2.1.0',
			qubits: 24,
			status: 'online',
			lastSample: '2020-07-23 15:30',
			onlineSince: '2020-07-22 15:30',
			offlineSince: ''
		},
		{
			name: 'IBMQ Montevideo',
			version: '1.0.2',
			qubits: 16,
			status: 'online',
			lastSample: '2018-02-12 12:30',
			onlineSince: '2015-03-22 18:30',
			offlineSince: ''
		},
		{
			name: 'IBMQ Lima',
			version: '16.2.0',
			qubits: 5,
			status: 'online',
			lastSample: '2021-07-22 15:30',
			onlineSince: '2021-02-18 12:30',
			offlineSince: ''
		},
		{
			name: 'IBMQ Manilla',
			version: '0.1.1',
			qubits: 8,
			status: 'offline',
			lastSample: '2022-01-02 13:30',
			onlineSince: '',
			offlineSince: '2022-02-22 18:30'
		}
	]);
	const sortedBackends = useMemo(() => {
		let filtered = backends.filter((backend) => filter.includes(backend.status));

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
	}, [search, sort.order, sort.option, backends, filter]);

	console.log('index render');
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
