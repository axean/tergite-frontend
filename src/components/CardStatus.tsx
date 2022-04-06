import React from 'react';
import { Text, CircularProgress, CircularProgressLabel, Flex } from '@chakra-ui/react';
import { useQuery } from 'react-query';

interface CardStatusProps {
	percentage: number;
	noComputers: number;
}

const CardStatus = () => {
	const { isLoading, data, error } = useQuery('backendStatus', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/online_statuses').then((res) => {
			return res.json();
		})
	);

	if (isLoading) return <p> loading </p>;

	if (error) return <p> {error} </p>;

	var online = 0;
	var total = 0;

	Object.keys(data).forEach(function (key) {
		if (data[key]) {
			online++;
		}
		total++;
	});

	console.log(online + ' ' + total);

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
					{online}
				</Text>
			</Flex>
			<Flex alignItems='center'>
				<CircularProgress
					value={Math.round((online / total) * 100)}
					color='#38B2AC'
					trackColor='#d9fff3'
					size='3em'
				>
					<CircularProgressLabel>
						<Text fontSize='lg' fontWeight='bold'>
							{Math.round((online / total) * 100)}%
						</Text>
					</CircularProgressLabel>
				</CircularProgress>
			</Flex>
		</Flex>
	);
};

export default CardStatus;
