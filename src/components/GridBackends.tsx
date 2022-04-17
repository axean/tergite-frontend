import { SimpleGrid, Flex, Box, Text } from '@chakra-ui/react';
import React, { memo } from 'react';
import CardBackend, { CardBackendProps } from './CardBackend';
import NextLink from 'next/link';

export interface GridBackendsProps {
	backends: CardBackendProps[];
}
const GridBackends: React.FC<GridBackendsProps> = ({ backends }) => {
	return (
		<SimpleGrid columns={4} gap='8'>
			{backends.map((backend, index) => (
				<NextLink href={`/${backend.backend_name}`} key={index}>
					<a>
						<CardBackend key={index} {...backend} />
					</a>
				</NextLink>
			))}
		</SimpleGrid>
	);
};

export default memo(GridBackends);
