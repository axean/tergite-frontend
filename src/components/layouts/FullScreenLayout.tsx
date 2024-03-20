import { Container, Flex, Text } from '@chakra-ui/react';
import React from 'react';
import Navbar from '../primitives/Navbar';
import useCurrentUser from '@/hooks/useCurrentUser';

const FullScreenLayout = ({ children }) => {
	const { user, logout, isLoggingOut } = useCurrentUser();
	return (
		<Container
			flexDir='column'
			minH='100vh'
			bg='gray.200'
			maxW='full'
			p={0}
			id='outerContainer'
			centerContent
		>
			<Navbar
				user={user}
				onLogout={logout}
				isLoggingOut={isLoggingOut}
				logo='WACQT | Wallenberg Centre for Quantum Technology'
				isFullScreen
			/>
			<Flex id='innerContainer' h='full' w='100%' flex='1' flexDirection='column'>
				{user && children}
				{!user && (
					<Text data-cy-not-authenticated color='red.400'>
						Not Authenticated
					</Text>
				)}
			</Flex>
		</Container>
	);
};

export default FullScreenLayout;
