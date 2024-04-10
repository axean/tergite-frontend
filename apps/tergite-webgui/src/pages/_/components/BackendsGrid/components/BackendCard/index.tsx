import { Flex, Text, Box } from '@chakra-ui/react';
import { useMemo } from 'react';
import OnlineStatus from '@/components/primitives/OnlineStatus';

export default function BackendCard({
	backend_name,
	backend_version,
	n_qubits,
	is_online,
	last_update_date,
	online_date
}: API.Response.DeviceDetail) {
	const last_update_date_str = useMemo(() => last_update_date.split('T')[0], [last_update_date]);
	const online_date_str = useMemo(() => online_date.split('T')[0], [online_date]);

	return (
		<Box
			bg={is_online ? 'white' : 'gray.100'}
			py='2'
			px='4'
			borderRadius='md'
			boxShadow='lg'
			color={is_online ? 'black' : 'gray.500'}
			data-cy-device={backend_name}
		>
			<Flex justify='space-between'>
				{' '}
				<Text fontSize='xl' fontWeight='extrabold' data-cy-device-name>
					{' '}
					{backend_name}
				</Text>{' '}
				<OnlineStatus isOnline={is_online} />
			</Flex>
			<Flex mt='2'>
				<Text fontSize='md' fontWeight='regular' mr='2'>
					version:
				</Text>
				<Text fontWeight='bold' data-cy-device-version>
					{backend_version}
				</Text>
			</Flex>
			<Flex>
				<Text fontSize='md' fontWeight='regular' mr='2'>
					qubits:
				</Text>
				<Text fontWeight='bold' data-cy-device-n-qubits>
					{n_qubits}
				</Text>
			</Flex>
			<Flex>
				<Text fontSize='md' fontWeight='regular' mr='2'>
					last update:
				</Text>
				<Text fontWeight='bold' data-cy-device-last-update>
					{last_update_date_str}
				</Text>
			</Flex>
			<Text fontWeight='bold' fontSize='sm' mt='2' color={is_online ? 'gray.700' : 'inherit'}>
				{' '}
				{is_online ? `Online since` : `Last seen`}
			</Text>
			<Text fontWeight='bold'>{is_online ? online_date_str : last_update_date_str}</Text>
		</Box>
	);
}
