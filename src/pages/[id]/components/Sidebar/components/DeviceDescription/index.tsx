import { Text } from '@chakra-ui/react';
import React from 'react';

export const DeviceDescription = ({ device }: Props) => (
	<>
		<Text fontSize='2xl' fontWeight='bold' color='black' mt='10'>
			Description
		</Text>
		<Text fontSize='lg' color='black' data-cy-description>
			{device?.backend_name}
		</Text>
	</>
);

interface Props {
	device: API.Response.DeviceDetail;
}

export default DeviceDescription;
