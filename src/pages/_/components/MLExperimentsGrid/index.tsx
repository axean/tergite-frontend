import { SimpleGrid } from '@chakra-ui/react';
import React from 'react';
import MLExperimentCard from './components/MLExperimentCard';
import NextLink from 'next/link';
import Toolbar from './components/Toolbar';
import useRefreshableState from '../../../../hooks/useRefreshableState';
import DefaultSkeleton from '../../../../components/primitives/DefaultSkeleton';
import { getDefaultMLExperiment } from '../../../../utils/api';

export default function MLExperimentsGrid({ title }: Props) {
	const { data, error, refresh, isRefreshing } = useRefreshableState<API.Response.MLExperiment[]>(
		[],
		async () => {
			try {
				/**
				 * Refreshes the data on the page. For now, it is refreshing only the ML experiment data
				 * FIXME: Instead of fetching fresh data for the ML experiments,
				 * 		it is getting only the experiment we are sure of. This is a temporary hack just for the
				 * 		June 2023 demo
				 */
				const response = await getDefaultMLExperiment();
				return [response];
			} catch (e) {
				console.error(e?.detail);
				throw 'error retrieving fresh ML experiments.';
			}
		}
	);

	return (
		<>
			<Toolbar title={title} onRefreshBtnClick={refresh} />

			<DefaultSkeleton isLoading={isRefreshing} error={error}>
				<SimpleGrid columns={4} gap='8' data-cy-ml-experiments>
					{data?.map((experiment, index) => (
						<NextLink href={`/ml-experiments/${experiment.experiment_id}`} key={index}>
							<MLExperimentCard key={index} {...experiment} />
						</NextLink>
					))}
				</SimpleGrid>
			</DefaultSkeleton>
		</>
	);
}

interface Props {
	title: string;
}
