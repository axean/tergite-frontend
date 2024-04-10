import { Heading } from '@chakra-ui/react';
import React from 'react';

const SectionCardTitle = ({ text }: Props) => (
	<Heading as='h3' fontSize='l' fontWeight='light' color='black' mb='10' textAlign='center'>
		{text}
	</Heading>
);

interface Props {
	text: string;
}

export default SectionCardTitle;
