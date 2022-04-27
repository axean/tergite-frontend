import { Skeleton, Stack } from '@chakra-ui/react';
import React from 'react';

interface VisualizationSkeletonProps {}

export const VisualizationSkeleton: React.FC<VisualizationSkeletonProps> = ({}) => {
	return (
		<Stack mt={3} spacing={7}>
			<Skeleton height='5em' />
			<Skeleton height='40em' />
		</Stack>
	);
};
