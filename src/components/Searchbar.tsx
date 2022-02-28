import { SearchIcon } from '@chakra-ui/icons';
import { InputGroup, Input, InputLeftElement } from '@chakra-ui/react';
import React from 'react';

const SearchBar = () => {
	//TODO: add the actual search functionalitity
	return (
		<InputGroup>
			<InputLeftElement pointerEvents='none'>
				<SearchIcon />
			</InputLeftElement>
			<Input type='text' placeholder='Search' backgroundColor='#FFFFFF' />
		</InputGroup>
	);
};

export default SearchBar;
