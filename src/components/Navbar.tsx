import { Box, Container, Text, Link } from '@chakra-ui/react';
import React from 'react';
import NextLink from 'next/link';
const Navbar = () => {
	return (
		<Container bg='teal.400' maxW='full' centerContent id='main-navbar'>
			<Container py='2' maxW='8xl'>
				<Box>
					<Text
						as='h1'
						fontSize='2xl'
						color='white'
						fontWeight='bold'
						textAlign='left'
						w='fit-content'
					>
						<NextLink href='/' passHref>
							WAQCT | Wallenberg Centre for Quantum Technology
						</NextLink>
					</Text>
				</Box>
			</Container>
		</Container>
	);
};

export default Navbar;
