import { SimpleGrid, Flex, Box, Text } from '@chakra-ui/react';
import React from 'react';
import NextLink from 'next/link';
interface CardBackendProps {
	name: string;
	version: string;
	qubits: number;
	status: 'online' | 'offline';
	lastSample: string;
	onlineSince?: string;
	offlineSince?: string;
}
const CardBackend = ({
	name,
	version,
	qubits,
	lastSample,
	status,
	onlineSince,
	offlineSince
}: CardBackendProps) => {
	const isOnline = status === 'online';
	return (
		<NextLink href='/detail/'>
			<a>
				<Box
					bg={isOnline ? 'white' : 'gray.100'}
					py='2'
					px='4'
					borderRadius='md'
					boxShadow='lg'
					color={isOnline ? 'black' : 'gray.500'}
				>
					<Flex justify='space-between'>
						{' '}
						<Text fontSize='xl' fontWeight='extrabold'>
							{' '}
							{name}
						</Text>{' '}
						<Flex align='center'>
							<Text fontSize='sm' mr='2'>
								{status}{' '}
							</Text>
							<Box
								display='inline-block'
								w='4'
								h='4'
								bg={isOnline ? 'green.400' : 'red.400'}
								borderRadius='full'
							></Box>
						</Flex>
					</Flex>
					<Flex mt='2'>
						<Text fontSize='md' fontWeight='regular' mr='2'>
							version:
						</Text>
						<Text fontWeight='bold'>{version}</Text>
					</Flex>
					<Flex>
						<Text fontSize='md' fontWeight='regular' mr='2'>
							qubits:
						</Text>
						<Text fontWeight='bold'>{qubits}</Text>
					</Flex>
					<Flex>
						<Text fontSize='md' fontWeight='regular' mr='2'>
							last sample:
						</Text>
						<Text fontWeight='bold'>{lastSample}</Text>
					</Flex>
					<Text
						fontWeight='bold'
						fontSize='sm'
						mt='2'
						color={isOnline ? 'gray.700' : 'inherit'}
					>
						{' '}
						{isOnline
							? `Online since  ${onlineSince}`
							: `Offline since ${offlineSince}`}
					</Text>
				</Box>
			</a>
		</NextLink>
	);
};

interface GridBackendsProps {
	backends: CardBackendProps[];
}
const GridBackends = ({ backends }: GridBackendsProps) => {
	return (
		<SimpleGrid columns={4} gap='8'>
			{backends.map((backend, index) => (
				<CardBackend key={index} {...backend} />
			))}
		</SimpleGrid>
	);
};
GridBackends.defaultProps = {
	backends: [
		{
			name: 'IBMQ Santiago',
			version: '2.1.0',
			qubits: 24,
			status: 'online',
			lastSample: '2020-07-23 15:30',
			onlineSince: '2020-07-22 15:30'
		},
		{
			name: 'IBMQ Montevideo',
			version: '1.0.2',
			qubits: 16,
			status: 'online',
			lastSample: '2018-02-12 12:30',
			onlineSince: '2015-03-22 18:30'
		},
		{
			name: 'IBMQ Lima',
			version: '16.2.0',
			qubits: 5,
			status: 'online',
			lastSample: '2021-07-22 15:30',
			onlineSince: '2021-02-18 12:30'
		},
		{
			name: 'IBMQ Manilla',
			version: '0.1.1',
			qubits: 8,
			status: 'offline',
			lastSample: '2022-01-02 13:30',
			offlineSince: '2022-02-22 18:30'
		}
	]
};

export default GridBackends;
