import { Flex, Text, Box } from '@chakra-ui/react';
import { useMemo } from 'react';
import OnlineStatus from '../../../../../../components/primitives/OnlineStatus';

const BackendCard: React.FC<API.Response.Device> = ({
	name,
	version,
	num_qubits,
	is_online,
	timelog
}) => {
	const timestamp = useMemo(() => timelog.REGISTERED.split('T')[0], [timelog]);

	return (
		<Box
			bg={is_online ? 'white' : 'gray.100'}
			py='2'
			px='4'
			borderRadius='md'
			boxShadow='lg'
			color={is_online ? 'black' : 'gray.500'}
			data-cy-device
		>
			<Flex justify='space-between'>
				{' '}
				<Text fontSize='xl' fontWeight='extrabold' data-cy-device-name>
					{' '}
					{name}
				</Text>{' '}
				<OnlineStatus isOnline={is_online} />
			</Flex>
			<Flex mt='2'>
				<Text fontSize='md' fontWeight='regular' mr='2'>
					version:
				</Text>
				<Text fontWeight='bold' data-cy-device-version>
					{version}
				</Text>
			</Flex>
			<Flex>
				<Text fontSize='md' fontWeight='regular' mr='2'>
					qubits:
				</Text>
				<Text fontWeight='bold' data-cy-device-n-qubits>
					{num_qubits}
				</Text>
			</Flex>
			<Flex>
				<Text fontSize='md' fontWeight='regular' mr='2'>
					last update:
				</Text>
				<Text fontWeight='bold' data-cy-device-last-update>
					{timestamp}
				</Text>
			</Flex>
			<Text fontWeight='bold' fontSize='sm' mt='2' color={is_online ? 'gray.700' : 'inherit'}>
				{' '}
				{is_online ? `Online since` : `Last seen`}
			</Text>
			<Text fontWeight='bold'>{timestamp}</Text>
		</Box>
	);
};
export default BackendCard;
