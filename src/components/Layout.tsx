import { Container } from '@chakra-ui/react';
import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
	return (
		<Container minH='100vh' bg='gray.200' maxW='full' p={0} centerContent>
			<Navbar />
			<Container maxW='8xl'>{children}</Container>
		</Container>
	);
};

export default Layout;
