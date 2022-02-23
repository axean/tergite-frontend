import { Box, Container, Text } from '@chakra-ui/react';
import React from 'react';

const Navbar = () => {
	return (
		<Container bg='teal.400' maxW='full' centerContent>
			<Container py='2' maxW='8xl'>
				<Text fontSize='2xl' color='white' fontWeight='bold'>
					WAQCT | Wallenberg Centre for Quantum Technology
				</Text>
			</Container>
		</Container>
	);
};

export default Navbar;
