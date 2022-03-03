import { Box, Container, Flex } from '@chakra-ui/react';
import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
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
			<Navbar />
			<Flex id='innerContainer' maxW='8xl' w='100%' flex='1' px='4' flexDirection='column'>
				{children}
			</Flex>
		</Container>
	);
};

export default Layout;
