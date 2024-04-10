import { Skeleton, Stack } from '@chakra-ui/react';
import React from 'react';

export default function VisualizationSkeleton({}) {
	return (
		<Stack mt={3} spacing={7}>
			<Skeleton height='5em' />
			<Skeleton height='40em' />
		</Stack>
	);
}

interface Props {}
