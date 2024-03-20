import { Flex, Heading } from '@chakra-ui/react';
import React from 'react';

const Toolbar = ({ experimentId }: TProps) => (
	<Flex
		p='4'
		justifyContent='space-between'
		alignItems='center'
		data-cy-tabbar
		borderBottom='0.5px'
		borderBottomColor='gray'
	>
		<Heading as='h2' fontSize='xl' fontWeight='light' color='black' textTransform='none'>
			{new Date().toLocaleDateString()}: experiment details for {experimentId}
		</Heading>
	</Flex>
);

interface TProps {
	experimentId: string;
}

export default Toolbar;
