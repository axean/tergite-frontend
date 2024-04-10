import { Flex, Stack, useColorModeValue } from '@chakra-ui/react';
import React from 'react';
import FullScreenToggleBtn from './components/FullScreenToggleBtn';
import TabbarItem from './components/TabbarItem';

const Tabbar = ({ isFullScreen, onFullScreenToggleBtnClick, items }: Props) => {
	return (
		<Flex
			bg={useColorModeValue('white', 'gray.800')}
			color={useColorModeValue('gray.600', 'white')}
			boxShadow='lg'
			minH={'60px'}
			py={{ base: 2 }}
			px={{ base: 2 }}
			borderBottom={1}
			borderStyle={'solid'}
			borderColor={useColorModeValue('gray.200', 'gray.900')}
			align={'center'}
			justifyContent='left'
		>
			<Flex display={{ base: 'none', md: 'flex' }} align='center'>
				{isFullScreen && <FullScreenToggleBtn onClick={onFullScreenToggleBtnClick} />}
				<Stack direction={'row'} spacing={4}>
					{items.map(({ label, href }) => (
						<TabbarItem key={label} label={label} href={href} />
					))}
				</Stack>
			</Flex>
		</Flex>
	);
};

interface Props {
	isFullScreen: boolean;
	onFullScreenToggleBtnClick: () => void;
	items: Array<TabbarItemConfig>;
}

export interface TabbarItemConfig {
	label: string;
	href: string;
}

export default Tabbar;
