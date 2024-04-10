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

export default function Sort({ sort: { order, option }, setSort }: Props) {
	return (
		<Menu closeOnSelect={false}>
			<MenuButton data-cy-sort-button as={Button} leftIcon={<MdOutlineSort />}>
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
					<MenuItemOption data-cy-sort-order-asc value='asc'>
						Ascending
					</MenuItemOption>
					<MenuItemOption data-cy-sort-order-desc value='desc'>
						Descending
					</MenuItemOption>
				</MenuOptionGroup>
				<MenuDivider />
				<MenuOptionGroup
					title='Options'
					defaultValue={option}
					value={option}
					type='radio'
					onChange={(e) => setSort({ order, option: e as string })}
				>
					<MenuItemOption data-cy-sort-name value='backend_name'>
						Name
					</MenuItemOption>
					<MenuItemOption data-cy-sort-online-date value='online_date'>
						Online date
					</MenuItemOption>
					<MenuItemOption data-cy-sort-status value='is_online'>
						Online/Offline
					</MenuItemOption>
				</MenuOptionGroup>
			</MenuList>
		</Menu>
	);
}

interface Props {
	sort: { order: string; option: string };
	setSort: React.Dispatch<React.SetStateAction<{ order: string; option: string }>>;
}
