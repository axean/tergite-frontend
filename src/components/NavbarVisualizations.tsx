import {
	Box,
	Button,
	Flex,
	Icon,
	Link,
	Popover,
	PopoverTrigger,
	Stack,
	useColorModeValue
} from '@chakra-ui/react';
import React from 'react';
import { MdLastPage } from 'react-icons/md';

interface NavbarVisualizationsProps {
	isCollapsed: boolean;
	onToggleCollapse: React.Dispatch<void>;
}

const NavbarVisualizations: React.FC<NavbarVisualizationsProps> = ({
	isCollapsed,
	onToggleCollapse
}) => {
	return (
		<Box>
			<Flex
				bg={useColorModeValue('white', 'gray.800')}
				color={useColorModeValue('gray.600', 'white')}
				minH={'60px'}
				py={{ base: 2 }}
				px={{ base: 0 }}
				borderBottom={1}
				borderStyle={'solid'}
				borderColor={useColorModeValue('gray.200', 'gray.900')}
				align={'center'}
				justifyContent='left'
			>
				<Flex display={{ base: 'none', md: 'flex' }} align='center'>
					{isCollapsed && (
						<Button p='2' onClick={() => onToggleCollapse()}>
							<Icon as={MdLastPage} w={8} h={8} />
						</Button>
					)}
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
								fontSize={'lg'}
								fontWeight={600}
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
