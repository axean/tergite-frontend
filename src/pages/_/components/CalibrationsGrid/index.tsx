import { SimpleGrid } from '@chakra-ui/react';
import React from 'react';
import { useQuery } from 'react-query';
import CalibrationCard from './components/CalibrationCard';
import NextLink from 'next/link';
import DefaultSkeleton from '../../../../components/primitives/DefaultSkeleton';
import Toolbar from './components/Toolbar';
import { getAllUncalibratedCalibrations } from '../../../../utils/api';

export interface Props {
	title: string;
}
export default function CalibrationsGrid({ title }: Props) {
	const { isLoading, data, error } = useQuery(
		'all-uncalibrated-calibrations',
		getAllUncalibratedCalibrations
	);

	return (
		<>
			<Toolbar title={title} />

			<DefaultSkeleton isLoading={isLoading} error={error}>
				<SimpleGrid columns={4} gap='8' mb='4' data-cy-calibrations>
					{data?.map((calibration, index) => (
						<NextLink href={`/tune-up/${calibration.name || 'default'}`} key={index}>
							<CalibrationCard
								key={index}
								{...calibration}
								name='Rabi oscillations'
							/>
						</NextLink>
					))}
				</SimpleGrid>
			</DefaultSkeleton>
		</>
	);
}
