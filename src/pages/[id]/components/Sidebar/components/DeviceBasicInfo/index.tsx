import { Box } from '@chakra-ui/react';
import React, { useMemo } from 'react';
import OnlineTimeInfo from './components/OnlineTimeInfo';
import InfoItem from './components/InfoItem';

export default function DeviceBasicInfo({
	backend_name,
	backend_version,
	sample_name,
	n_qubits,
	is_online,
	last_update_date
}: Props) {
	return (
		<Box borderRadius='md' flex='1' mb='2'>
			<InfoItem data-cy-version label='version' value={backend_version} />
			<InfoItem data-cy-qubits label='qubits' value={n_qubits} />
			<InfoItem data-cy-last-update label='last update' value={last_update_date} />
			<InfoItem data-cy-sample-name label='sample name' value={sample_name} />
			<OnlineTimeInfo isOnline={is_online} timestampString={last_update_date} />
		</Box>
	);
}

type Props = Omit<API.Response.DeviceDetail, 'device_properties'>;
