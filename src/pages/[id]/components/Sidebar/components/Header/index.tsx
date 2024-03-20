import { Flex, Text } from '@chakra-ui/react';
import React, { MouseEventHandler } from 'react';
import OnlineStatus from '../../../../../../components/primitives/OnlineStatus';
import VisibilityToggleBtn from './components/VisibilityToggle';

export default function Header({ device, onVisibilityToggleClick }: Props) {
	return (
		<Flex justifyContent='space-between'>
			<Text fontSize='2xl' fontWeight='extrabold' data-cy-name>
				{device?.backend_name}
			</Text>
			<Flex justifyContent='end' gap='2'>
				<OnlineStatus isOnline={device?.is_online} />
				<VisibilityToggleBtn onClick={onVisibilityToggleClick} />
			</Flex>
		</Flex>
	);
}

interface Props {
	onVisibilityToggleClick: MouseEventHandler<HTMLButtonElement>;
	device: API.Response.DeviceDetail;
}
