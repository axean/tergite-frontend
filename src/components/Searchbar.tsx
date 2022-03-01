import { Icon, Input, InputGroup, InputLeftElement } from '@chakra-ui/react';
import React from 'react';
import { MdOutlineSearch } from 'react-icons/md';
const SearchBar = () => {
	//TODO: add the actual search functionalitity
	return (
		<InputGroup w='md'>
			<InputLeftElement pointerEvents='none'>
				<Icon as={MdOutlineSearch} />
			</InputLeftElement>
			<Input type='text' placeholder='Search' backgroundColor='#FFFFFF' />
		</InputGroup>
	);
};

export default SearchBar;
