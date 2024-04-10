import { Box, Flex, Heading, Divider, Stack } from '@chakra-ui/react';
import React from 'react';
import { useQuery } from 'react-query';
import DefaultSkeleton from '../../components/primitives/DefaultSkeleton';
import { getMLExperiment, getPreTaggedMLExperiment } from '../../utils/api';
import ScatterPlot from './components/ScatterPlot';
import Toolbar from './components/Toolbar';

const MLExperimentDetail = ({ id }) => {
	const {
		isLoading,
		error,
		data: preTaggedData
	} = useQuery<API.Response.MLExperiment>('getPreTaggedMLExperiment', getPreTaggedMLExperiment);

	const { data: currentResults } = useQuery<API.Response.MLExperiment>(
		`ml-experiment-${id}`,
		async () => await getMLExperiment(`${id}`),
		{ refetchInterval: 2000 }
	);

	return (
		<Flex
			flexDir='column'
			flex='1'
			mt='8'
			bg='white'
			id='deailId'
			borderRadius='md'
			boxShadow='lg'
		>
			<Toolbar experimentId={`${id}`} />
			<Divider />
			<Box
				bg='white'
				flex='6'
				p='4'
				minH='sm'
				mr='2'
				borderRightWidth='thin'
				borderRightColor='gray.200'
			>
				<Heading
					as='h3'
					fontSize='l'
					fontWeight='light'
					color='black'
					mb='5'
					textAlign='center'
				>
					Classification results (x vs y)
				</Heading>

				<DefaultSkeleton isLoading={isLoading} error={error}>
					<Stack id='classificationScatterStack' alignItems='center'>
						{preTaggedData && currentResults && (
							<ScatterPlot
								preTaggedResults={preTaggedData}
								currentResults={currentResults}
							/>
						)}
					</Stack>
				</DefaultSkeleton>
			</Box>
		</Flex>
	);
};

MLExperimentDetail.getInitialProps = async (ctx) => ({ id: await ctx.query.id });

export default MLExperimentDetail;
