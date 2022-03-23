import {
	Button,
	Icon,
	Menu,
	MenuButton,
	MenuItemOption,
	MenuList,
	MenuOptionGroup
} from '@chakra-ui/react';
import React, { memo } from 'react';
import { MdOutlineFilterList } from 'react-icons/md';

interface FilterMenuProps {
	filter: string[];
	setFilter: React.Dispatch<React.SetStateAction<string[]>>;
}
const Filter: React.FC<FilterMenuProps> = ({ filter, setFilter }) => {
	return (
		<Menu closeOnSelect={false}>
			<MenuButton as={Button} leftIcon={<Icon as={MdOutlineFilterList} />}>
				Filter
			</MenuButton>
			<MenuList minWidth='240px'>
				<MenuOptionGroup
					title='Filters'
					type='checkbox'
					defaultValue={filter}
					value={filter}
					onChange={(e) => setFilter(e as string[])}
				>
					<MenuItemOption value='online'>Online</MenuItemOption>
					<MenuItemOption value='offline'>Offline</MenuItemOption>
					<MenuItemOption value='other'>Other</MenuItemOption>
				</MenuOptionGroup>
			</MenuList>
		</Menu>
	);
};

export default memo(Filter);
