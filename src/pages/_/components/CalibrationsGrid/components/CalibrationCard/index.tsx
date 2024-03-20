import { Flex, Text, Box } from '@chakra-ui/react';
import React, { useMemo } from 'react';

const CalibrationCard: React.FC<API.Response.Calibration> = ({ name }) => {
	const displayName = useMemo(() => name || 'default', [name]);

	return (
		<Box
			bg='white'
			py='2'
			px='4'
			borderRadius='md'
			boxShadow='lg'
			color='black'
			data-cy-calibration
		>
			<Flex justify='space-between'>
				{' '}
				<Text fontSize='xl' fontWeight='bold' data-cy-calibration-name>
					{' '}
					{displayName}
				</Text>{' '}
			</Flex>
		</Box>
	);
};
export default CalibrationCard;
