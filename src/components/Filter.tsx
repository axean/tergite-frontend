import React from "react";
import {Icon, Menu, MenuButton, MenuDivider, MenuItemOption, MenuList, MenuOptionGroup, Button} from '@chakra-ui/react';
import {FaFilter} from "react-icons/fa"

const Filter = () => {
    return(
        <Menu closeOnSelect={false}>
        <MenuButton as={Button} leftIcon={<FaFilter/>}>
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
    )
}

export default Filter;