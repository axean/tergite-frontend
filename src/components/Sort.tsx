import {
	Icon,
	Menu,
	MenuButton,
	MenuDivider,
	MenuItemOption,
	MenuList,
	MenuOptionGroup,
	Button,
	OrderedList
} from '@chakra-ui/react';
import React, { memo } from 'react';

import { MdOutlineSort } from 'react-icons/md';

//name, online date, online or offline status
interface SortMenuProps {
	sort: { order: string; option: string };
	setSort: React.Dispatch<React.SetStateAction<{ order: string; option: string }>>;
}
const Sort: React.FC<SortMenuProps> = ({ sort: { order, option }, setSort }) => {
	return (
		<Menu closeOnSelect={false}>
			<MenuButton as={Button} leftIcon={<MdOutlineSort />}>
				Sort
			</MenuButton>
			<MenuList minWidth='240px'>
				<MenuOptionGroup
					defaultValue={order}
					value={order}
					title='Order'
					type='radio'
					onChange={(e) => setSort({ order: e as string, option })}
				>
					<MenuItemOption value='asc'>Ascending</MenuItemOption>
					<MenuItemOption value='desc'>Descending</MenuItemOption>
				</MenuOptionGroup>
				<MenuDivider />
				<MenuOptionGroup
					title='Options'
					defaultValue={option}
					value={option}
					type='radio'
					onChange={(e) => setSort({ order, option: e as string })}
				>
					<MenuItemOption value='backend_name'>Name</MenuItemOption>
					<MenuItemOption value='online_date'>Online date</MenuItemOption>
					<MenuItemOption value='is_online'>Online/Offline</MenuItemOption>
				</MenuOptionGroup>
			</MenuList>
		</Menu>
	);
};

export default memo(Sort);
