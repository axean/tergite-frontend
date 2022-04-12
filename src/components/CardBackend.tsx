import { Flex, Text, Box } from '@chakra-ui/react';
import NextLink from 'next/link';

export interface CardBackendProps {
	name: string;
	version: string;
	n_qubits: number;
	is_online: boolean;
	last_update: string;
}
const CardBackend: React.FC<CardBackendProps> = ({
	name,
	version,
	n_qubits,
	is_online,
	last_update
}) => {
	return (
		<NextLink href={`/${name}`}>
			<a>
				<Box
					bg={is_online ? 'white' : 'gray.100'}
					py='2'
					px='4'
					borderRadius='md'
					boxShadow='lg'
					color={is_online ? 'black' : 'gray.500'}
				>
					<Flex justify='space-between'>
						{' '}
						<Text fontSize='xl' fontWeight='extrabold'>
							{' '}
							{name}
						</Text>{' '}
						<Flex align='center'>
							<Text fontSize='sm' mr='2'>
								{is_online ? 'online' : 'offline'}{' '}
							</Text>
							<Box
								display='inline-block'
								w='4'
								h='4'
								bg={is_online ? 'green.400' : 'red.400'}
								borderRadius='full'
							></Box>
						</Flex>
					</Flex>
					<Flex mt='2'>
						<Text fontSize='md' fontWeight='regular' mr='2'>
							version: PLACEHOLDER
						</Text>
						<Text fontWeight='bold'>{version}</Text>
					</Flex>
					<Flex>
						<Text fontSize='md' fontWeight='regular' mr='2'>
							qubits:
						</Text>
						<Text fontWeight='bold'>{n_qubits}</Text>
					</Flex>
					<Flex>
						<Text fontSize='md' fontWeight='regular' mr='2'>
							last update:
						</Text>
						{/* <Text fontWeight='bold'>{last_update.split('T')[0]}</Text> */}
					</Flex>
					<Text
						fontWeight='bold'
						fontSize='sm'
						mt='2'
						color={is_online ? 'gray.700' : 'inherit'}
					>
						{' '}
						{is_online ? `Online since PLACEHOLDER` : `Offline since PLACEHOLDER`}
					</Text>
				</Box>
			</a>
		</NextLink>
	);
};
export default CardBackend;
