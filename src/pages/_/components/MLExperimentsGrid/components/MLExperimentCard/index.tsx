import { Flex, Text, Box } from '@chakra-ui/react';
import React from 'react';

const MLExperimentCard = ({ experiment_id }: API.Response.MLExperiment) => {
	return (
		<Box
			bg='white'
			py='2'
			px='4'
			borderRadius='md'
			boxShadow='lg'
			color='black'
			data-cy-ml-experiment
		>
			<Flex justify='space-between'>
				{' '}
				<Text fontSize='xl' fontWeight='bold' data-cy-ml-experiment-id>
					{' '}
					{experiment_id}
				</Text>{' '}
			</Flex>
		</Box>
	);
};
export default MLExperimentCard;
