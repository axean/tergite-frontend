import { Box, Flex } from '@chakra-ui/react';
import React, { useMemo, MouseEventHandler } from 'react';
import DeviceBasicInfo from './components/DeviceBasicInfo';
import Header from './components/Header';
import DeviceDescription from './components/DeviceDescription';

export default function Sidebar({ onVisibilityToggleClick, device }: Props) {
	const bgColor = useMemo(() => (device?.is_online ? 'white' : 'gray.100'), [device?.is_online]);
	const color = useMemo(() => (device?.is_online ? 'black' : 'gray.500'), [device?.is_online]);

	return (
		<Flex flexDir='column' bg='white' flex='2' p='4' py='6' boxShadow='lg' data-cy-sidepanel>
			<Box pl='2' bg={bgColor} borderRadius='md' color={color}>
				<Header device={device} onVisibilityToggleClick={onVisibilityToggleClick} />
				<DeviceBasicInfo {...device} />
				<DeviceDescription device={device} />
			</Box>
		</Flex>
	);
}

interface Props {
	onVisibilityToggleClick: MouseEventHandler<HTMLButtonElement>;
	device: API.Response.DeviceDetail;
}
