import { CloseIcon, HamburgerIcon } from '@chakra-ui/icons';
import {
	Box,
	Button,
	Flex,
	Heading,
	IconButton,
	Link,
	Popover,
	PopoverTrigger,
	Stack,
	Text,
	useBreakpointValue,
	useColorModeValue
} from '@chakra-ui/react';
import React from 'react';

interface NavbarVisualizationsProps {}

const NavbarVisualizations: React.FC<NavbarVisualizationsProps> = ({}) => {
	return (
		<Box>
			<Flex
				bg={useColorModeValue('white', 'gray.800')}
				color={useColorModeValue('gray.600', 'white')}
				minH={'60px'}
				py={{ base: 2 }}
				px={{ base: 4 }}
				borderBottom={1}
				borderStyle={'solid'}
				borderColor={useColorModeValue('gray.200', 'gray.900')}
				align={'center'}
			>
				<Flex
					flex={{ base: 1, md: 'auto' }}
					ml={{ base: -2 }}
					display={{ base: 'flex', md: 'none' }}
				></Flex>
				<Flex display={{ base: 'none', md: 'flex' }} ml={10}>
					<DesktopNav />
				</Flex>
			</Flex>
		</Box>
	);
};

const DesktopNav = () => {
	const linkColor = useColorModeValue('black', 'gray.200');
	const linkHoverColor = useColorModeValue('teal.400', 'gray.800');

	return (
		<Stack direction={'row'} spacing={4}>
			{NAV_ITEMS.map((navItem) => (
				<Box key={navItem.label}>
					<Popover trigger={'hover'} placement={'bottom-start'}>
						<PopoverTrigger>
							<Link
								p={2}
								href={navItem.href ?? '#'}
								fontSize={'sm'}
								fontWeight={500}
								color={linkColor}
								_hover={{
									textDecoration: 'none',
									color: linkHoverColor
								}}
							>
								{navItem.label}
							</Link>
						</PopoverTrigger>
					</Popover>
				</Box>
			))}
		</Stack>
	);
};

interface NavItem {
	label: string;
	href?: string;
}

const NAV_ITEMS: Array<NavItem> = [
	{
		label: 'Qubit map',
		href: 'Qubitmap'
	},
	{
		label: 'Histogram',
		href: 'Histogram'
	},
	{
		label: 'Graph deviation',
		href: 'Graphdeviation'
	},
	{
		label: 'Line graph',
		href: 'Linegraph'
	},
	{
		label: 'Table view',
		href: 'Tableview'
	},
	{
		label: 'City plot',
		href: 'Cityplot'
	}
];

export default NavbarVisualizations;
