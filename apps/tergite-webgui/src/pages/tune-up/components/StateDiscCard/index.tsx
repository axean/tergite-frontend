import { Box, Flex, BoxProps } from '@chakra-ui/react';
import React from 'react';
import DefaultSkeleton from '../../../../components/primitives/DefaultSkeleton';
import ScatterPlot from './components/ScatterPlot';
import SectionCardTitle from './components/SectionCardTitle';

const StateDiscCard = ({ boxStyle = {}, title, isLoading, error, data, currentQubit }: Props) => (
	<Box bg='white' p='4' minH='sm' maxWidth='50%' minWidth='50%' {...boxStyle}>
		<SectionCardTitle text={title} />
		<Flex alignItems='center' gap='2' maxW='full' px='6'>
			<DefaultSkeleton isLoading={isLoading} error={error}>
				{data && <ScatterPlot data={data} currentQubit={currentQubit} />}
			</DefaultSkeleton>
		</Flex>
	</Box>
);

export default StateDiscCard;

interface Props {
	title: string;
	isLoading: boolean;
	error: any;
	data?: API.Response.Classification;
	currentQubit: string;
	boxStyle?: BoxProps;
}
