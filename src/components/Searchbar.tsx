import { Icon, Input, InputGroup, InputLeftElement } from '@chakra-ui/react';
import React, { memo } from 'react';
import { MdOutlineSearch } from 'react-icons/md';

interface SearchBarProps {
	search: string;
	setSearch: React.Dispatch<React.SetStateAction<string>>;
}
const SearchBar: React.FC<SearchBarProps> = ({ search, setSearch }) => {
	return (
		<InputGroup w='md'>
			<InputLeftElement pointerEvents='none'>
				<Icon as={MdOutlineSearch} />
			</InputLeftElement>
			<Input
				type='text'
				placeholder='Search'
				backgroundColor='#FFFFFF'
				onChange={(e) => setSearch(e.target.value)}
				value={search}
			/>
		</InputGroup>
	);
};

export default memo(SearchBar);
