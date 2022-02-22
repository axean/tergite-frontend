import { Box, Container, Text } from '@chakra-ui/react';
import React from 'react';

const Navbar = () => {
	return (
		<Container bg='teal.400' maxW='full' centerContent>
			<Box w='8xl' py='2'>
				<Text fontSize='2xl' color='white'>
					WAQCT | Wallenberg Centre for Quantum Technology
				</Text>
			</Box>
		</Container>
	);
};

export default Navbar;
