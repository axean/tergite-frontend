import { SimpleGrid, Flex, Box, Text } from '@chakra-ui/react';
import React, { memo } from 'react';
import NextLink from 'next/link';
export interface CardBackendProps {
	name: string;
	version: string;
	qubits: number;
	status: 'online' | 'offline';
	lastSample: string;
	onlineSince: string;
	offlineSince: string;
}
const CardBackend: React.FC<CardBackendProps> = ({
	name,
	version,
	qubits,
	lastSample,
	status,
	onlineSince,
	offlineSince
}) => {
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

export interface GridBackendsProps {
	backends: CardBackendProps[];
}
const GridBackends: React.FC<GridBackendsProps> = ({ backends }) => {
	return (
		<SimpleGrid columns={4} gap='8'>
			{backends.map((backend, index) => (
				<CardBackend key={index} {...backend} />
			))}
		</SimpleGrid>
	);
};

export default memo(GridBackends);
