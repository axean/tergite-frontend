import { Button, Container, Flex, Text } from '@chakra-ui/react';
import React from 'react';
import NextLink from 'next/link';

const Navbar = ({ logo, isFullScreen, user, onLogout, isLoggingOut }: Props) => {
	const maxWidth = isFullScreen ? '100%' : '8xl';

	return (
		<Container
			bg='teal.400'
			maxW='full'
			centerContent
			id='main-navbar'
			zIndex={100}
			data-cy-main-navbar
		>
			<Container py='2' maxW={maxWidth}>
				<Flex justifyContent='space-between'>
					<Text
						as='h1'
						fontSize='2xl'
						color='white'
						fontWeight='bold'
						textAlign='left'
						w='fit-content'
					>
						<NextLink href='/' passHref legacyBehavior>
							{logo}
						</NextLink>
					</Text>
					{user && (
						<Button isLoading={isLoggingOut} onClick={onLogout}>
							Logout
						</Button>
					)}
				</Flex>
			</Container>
		</Container>
	);
};

interface Props {
	logo: React.ReactElement | string;
	isFullScreen?: boolean;
	user?: API.User;
	onLogout: () => Promise<void>;
	isLoggingOut: boolean;
}

export default Navbar;
