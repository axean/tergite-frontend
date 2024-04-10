import { Text } from '@chakra-ui/react';
import React, { useMemo } from 'react';

export default function OnlineTimeInfo({ isOnline, timestampString }: Props) {
	const textColor = useMemo(() => (isOnline ? 'gray.700' : 'inherit'), [isOnline]);
	const label = useMemo(() => (isOnline ? 'Online since' : 'Offline since'), [isOnline]);

	return (
		<>
			<Text fontWeight='bold' fontSize='sm' mt='2' color={textColor}>
				{label}
			</Text>
			<Text fontWeight='bold'>{timestampString}</Text>
		</>
	);
}

interface Props {
	isOnline: boolean;
	timestampString: string;
}
