import { Container, Flex, Text } from '@chakra-ui/react';
import React, { PropsWithChildren } from 'react';
import Navbar from '../primitives/Navbar';
import useCurrentUser from '@/hooks/useCurrentUser';

const DefaultLayout = ({ children }: PropsWithChildren<Props>) => {
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
			/>
			<Flex id='innerContainer' maxW='8xl' w='100%' flex='1' px='4' flexDirection='column'>
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

export default DefaultLayout;

type Props = {};
