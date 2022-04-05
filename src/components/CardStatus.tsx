import React from 'react';
import { Text, CircularProgress, CircularProgressLabel, Flex } from '@chakra-ui/react';
import { useQuery } from 'react-query';

interface CardStatusProps {
	percentage: number;
	noComputers: number;
}

const CardStatus = () => {
	const { isLoading, data, error } = useQuery('backendStatus', () =>
		fetch('insertlink').then((res) => {
			res.json();
		})
	);

	if (isLoading || error) return '';

	const percOnl = (parseInt(data.onlineBackends) / parseInt(data.totalBackends)) * 100;

	return (
		<Flex
			justify='space-between'
			bg='white'
			rounded='xl'
			boxShadow='2xl'
			p='8'
			alignContent='center'
			h='full'
		>
			<Flex direction='column' justify='space-between'>
				<Text fontSize='2xl'>Systems online</Text>
				<Text fontWeight='bold' fontSize='xl'>
					{data.backendsOnline}
				</Text>
			</Flex>
			<Flex alignItems='center'>
				<CircularProgress value={1} color='#38B2AC' trackColor='#d9fff3' size='3em'>
					<CircularProgressLabel>
						<Text fontSize='lg' fontWeight='bold'>
							{percOnl}%
						</Text>
					</CircularProgressLabel>
				</CircularProgress>
			</Flex>
		</Flex>
	);
};

export default CardStatus;
