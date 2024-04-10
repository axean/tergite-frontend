import { Text } from '@chakra-ui/react';
import React from 'react';

export const GraphTitle = ({ channel }: Props) => (
	<Text fontSize='1rem' fontWeight='semibold' textAlign='center'>
		{`CHANNEL ${channel}`}
	</Text>
);

interface Props {
	channel: number;
}

export default GraphTitle;
