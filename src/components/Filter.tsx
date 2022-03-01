import {
	Button,
	Icon,
	Menu,
	MenuButton,
	MenuItemOption,
	MenuList,
	MenuOptionGroup
} from '@chakra-ui/react';
import React from 'react';
import { MdOutlineFilterList } from 'react-icons/md';
const Filter = () => {
	return (
		<Menu closeOnSelect={false}>
			<MenuButton as={Button} leftIcon={<Icon as={MdOutlineFilterList} />}>
				Filter
			</MenuButton>
			<MenuList minWidth='240px'>
				<MenuOptionGroup title='Filters' type='checkbox'>
					<MenuItemOption value='online'>Online</MenuItemOption>
					<MenuItemOption value='offline'>Offline</MenuItemOption>
					<MenuItemOption value='other'>Other</MenuItemOption>
				</MenuOptionGroup>
			</MenuList>
		</Menu>
	);
};

export default Filter;
