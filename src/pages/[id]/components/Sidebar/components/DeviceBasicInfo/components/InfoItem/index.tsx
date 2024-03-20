import { Flex, Text } from '@chakra-ui/react';
import React, { useMemo } from 'react';

export default function InfoItem({ label, value }: Props) {
	const extraProps = useMemo(() => ({ [`data-cy-${value}`.toLowerCase()]: true }), [value]);

	return (
		<Flex>
			<Text fontSize='md' fontWeight='regular' mr='2'>
				{`${label}:`}
			</Text>
			<Text fontWeight='bold' {...extraProps}>
				{value}
			</Text>
		</Flex>
	);
}
interface Props {
	label: string;
	value: any;
}
