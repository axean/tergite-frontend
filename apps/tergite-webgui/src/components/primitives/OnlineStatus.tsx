import { Flex, Text, Box } from '@chakra-ui/react';
import React from 'react';

const OnlineStatus = ({ isOnline }: Props) => (
	<Flex align='center'>
		<Text fontSize='sm' mr='2' data-cy-device-status>
			{isOnline ? 'online' : 'offline'}{' '}
		</Text>
		<Box
			display='inline-block'
			w='4'
			h='4'
			bg={isOnline ? 'green.400' : 'red.400'}
			borderRadius='full'
		></Box>
	</Flex>
);

interface Props {
	isOnline: boolean;
}

export default OnlineStatus;
