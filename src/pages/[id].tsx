import React from 'react';
import { useRouter } from 'next/router';
import { Box, Flex, Grid, GridItem, SimpleGrid, Text } from '@chakra-ui/react';
import NavbarVisualizations from '../components/NavbarVisualizations';

const Detail = () => {
	const router = useRouter();
	const id = router.query.id;
	console.log(id);
	return (
		<Flex flex='1' py='8' w='full' id='deailId'>
			<Grid templateColumns='1fr 1fr' templateRows='1fr 1fr' gap='8' flex='1'>
				<GridItem rowSpan={2} w='100%' h='100%' bg='gray.800'>
					<Text fontSize='4xl' color='white'>
						quantum computer information collapsable
					</Text>
				</GridItem>
				<GridItem rowSpan={2} w='100%' h='100%' bg='gray.800'>
					<NavbarVisualizations />
					<Text fontSize='4xl' color='white'>
						charts
					</Text>
				</GridItem>
			</Grid>
		</Flex>
	);
};

export default Detail;
