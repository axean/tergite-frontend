import { SimpleGrid, Flex, Box, Text } from '@chakra-ui/react';
import React, { memo } from 'react';
import CardBackend, { CardBackendProps } from './CardBackend';

export interface GridBackendsProps {
	//backends: CardBackendProps[];
	backends: Array<CardBackendProps>
}
const GridBackends: React.FC<GridBackendsProps> = ({ backends }) => {
	return (
		<SimpleGrid columns={4} gap='8'>
			{backends.map((backend, index) => (
				<CardBackend key={index} {...backend} />
			))}
		</SimpleGrid>
	);
};

export default memo(GridBackends);
