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
import NextLink from 'next/link';
import { Router, useRouter } from 'next/router';

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
	const router = useRouter();
	return (
		<Stack direction={'row'} spacing={4}>
			{NAV_ITEMS.map((navItem) => (
				<Box key={navItem.label}>
					<Popover trigger={'hover'} placement={'bottom-start'}>
						<PopoverTrigger>
							<Box>
								<NextLink href={router.query.id + '?type=' + navItem.href} passHref>
									<Link
										p={2}
										fontSize={'lg'}
										fontWeight={600}
										href={navItem.href ?? '#'}
										color={linkColor}
										_hover={{
											textDecoration: 'none',
											color: linkHoverColor
										}}
									>
										{navItem.label}
									</Link>
								</NextLink>
							</Box>
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
		label: 'Box plot',
		href: 'Boxplot'
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
