import React, { useMemo } from 'react';
import { Text, CircularProgress, CircularProgressLabel, Flex } from '@chakra-ui/react';
import { useQuery } from 'react-query';
import DefaultSkeleton from '../../../../../../components/primitives/DefaultSkeleton';
import { getAllDevices } from '../../../../../../utils/api';

export default function StatusCard() {
	const { isLoading, data, error } = useQuery<API.Response.Device[]>(
		'getAllDevices',
		getAllDevices
	);

	const onlineBackendsCount = useMemo(
		() => data && data.filter((v) => v.is_online).length,
		[data]
	);
	const onlineBackendsPercent = useMemo(
		() => onlineBackendsCount && data && Math.round((onlineBackendsCount / data.length) * 100),
		[onlineBackendsCount, data]
	);

	return (
		<Flex
			justify='space-between'
			bg='white'
			rounded='xl'
			boxShadow='2xl'
			p='8'
			alignContent='center'
			h='full'
			data-cy-online-statuses
		>
			<DefaultSkeleton isLoading={isLoading} error={error}>
				<Flex direction='column' justify='space-between'>
					<Text fontSize='2xl'>Systems online</Text>
					<Text fontWeight='bold' fontSize='xl' data-cy-systems-online>
						{onlineBackendsCount}
					</Text>
				</Flex>
				<Flex alignItems='center'>
					<CircularProgress
						value={onlineBackendsPercent || 0}
						color='#38B2AC'
						trackColor='#d9fff3'
						size='3em'
					>
						<CircularProgressLabel>
							<Text fontSize='lg' fontWeight='bold' data-cy-circle-text>
								{onlineBackendsPercent}%
							</Text>
						</CircularProgressLabel>
					</CircularProgress>
				</Flex>
			</DefaultSkeleton>
		</Flex>
	);
}
