import { Box, Link, Popover, PopoverTrigger, useColorModeValue } from '@chakra-ui/react';
import React from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

export default function TabbarItem({ label, href }: Props) {
	const linkColor = useColorModeValue('black', 'gray.200');
	const linkHoverColor = useColorModeValue('teal.400', 'gray.800');
	const router = useRouter();

	return (
		<Box>
			<Popover trigger={'hover'} placement={'bottom-start'}>
				<PopoverTrigger>
					<Box>
						<NextLink href={router.query.id + '?tab=' + href} passHref legacyBehavior>
							<Link
								p={2}
								fontSize={'lg'}
								fontWeight={600}
								href={href ?? '#'}
								color={linkColor}
								_hover={{
									textDecoration: 'none',
									color: linkHoverColor
								}}
								_focus={{
									color: linkHoverColor,
									boxShadow: 'none'
								}}
							>
								{label}
							</Link>
						</NextLink>
					</Box>
				</PopoverTrigger>
			</Popover>
		</Box>
	);
}

interface Props {
	label: string;
	href: string;
}
