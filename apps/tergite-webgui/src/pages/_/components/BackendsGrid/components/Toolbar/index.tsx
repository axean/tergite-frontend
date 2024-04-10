import { Flex, Button, Heading } from '@chakra-ui/react';
import Filter from './components/Filter';
import SearchBar from './components/SearchBar';
import Sort from './components/Sort';

const Toolbar = ({ title, search, setSearch, sort, setSort, filter, setFilter }: Props) => (
	<Flex justify='space-between' alignItems='center' mb='4'>
		<Flex alignItems='center' gap='4'>
			<Heading as='h3' fontSize='xl'>
				{title}
			</Heading>
			<SearchBar search={search} setSearch={setSearch} />
		</Flex>
		<Flex gap='4'>
			<Sort sort={sort} setSort={setSort} />
			<Filter filter={filter} setFilter={setFilter} />
		</Flex>
	</Flex>
);

interface Props {
	title: string;
	search: string;
	setSearch: React.Dispatch<React.SetStateAction<string>>;
	sort: { order: string; option: string };
	setSort: React.Dispatch<React.SetStateAction<{ order: string; option: string }>>;
	filter: string[];
	setFilter: React.Dispatch<React.SetStateAction<string[]>>;
}

export default Toolbar;
