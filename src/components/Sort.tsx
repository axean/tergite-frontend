import {Icon, Menu, MenuButton, MenuDivider, MenuItemOption, MenuList, MenuOptionGroup, Button} from '@chakra-ui/react';
import React from 'react';

import { FaSortAmountDownAlt } from 'react-icons/fa';

//name, online date, online or offline status
const Sort = () => {
	return (
		<Menu closeOnSelect={false}>
			<MenuButton as={Button} leftIcon={<FaSortAmountDownAlt/>}>
				Sort
			</MenuButton>
			<MenuList minWidth='240px'>
				<MenuOptionGroup defaultValue='asc' title='Order' type='radio'>
					<MenuItemOption value='asc'>Ascending</MenuItemOption>
					<MenuItemOption value='desc'>Descending</MenuItemOption>
				</MenuOptionGroup>
				<MenuDivider />
				<MenuOptionGroup title='Options' type='radio'>
					<MenuItemOption value='name'>Name</MenuItemOption>
					<MenuItemOption value='onlinedate'>Online date</MenuItemOption>
					<MenuItemOption value='onlineoffline'>Online/Offline</MenuItemOption>
				</MenuOptionGroup>
			</MenuList>
		</Menu>
	);
};

export default Sort;
