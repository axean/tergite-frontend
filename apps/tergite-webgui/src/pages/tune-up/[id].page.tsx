import { Flex, Divider } from '@chakra-ui/react';
import React, { useState, useCallback, useEffect } from 'react';
import { useQuery } from 'react-query';
import {
	getUntunedStateDiscrimination,
	getLatestStateDiscrimination,
	getDefaultStateDiscrimination,
	triggerTuneUp
} from '../../utils/api';
import DefaultSkeleton from '../../components/primitives/DefaultSkeleton';
import Toolbar from './components/Toolbar';
import StateDiscCard from './components/StateDiscCard';
import useRefreshableState from '../../hooks/useRefreshableState';

const MAX_REQUEST_RETRIES = 1;

const TuneUpPage = ({ id }) => {
	const [currentQubit, setCurrentQubit] = useState<string>('');
	const [previousData, setPreviousData] = useState<API.Response.Classification>();

	const { data: untunedData } = useQuery<API.Response.Classification>(
		`untuned-state-discrimination-data-${id}`,
		async () => await getUntunedStateDiscrimination(`${id}`)
	);

	// FIXME: dirty work around for showing some correct data during short demo.
	const { data: defaultData } = useQuery<API.Response.Classification>(
		`default-tuned-state-discrimination-data-${id}`,
		async () => await getDefaultStateDiscrimination(`${id}`)
	);

	const refreshCallback = useCallback(async () => {
		const backend = `${id}`;
		let jobId: string;

		try {
			const response = await triggerTuneUp(backend);
			jobId = response.job_id;
		} catch (e) {
			// FIXME: dirty work around for showing some correct data during short demo.
			if (defaultData) {
				return defaultData;
			}

			throw `${e?.detail || e}`;
		}

		try {
			const result = await getLatestStateDiscrimination(backend, jobId, MAX_REQUEST_RETRIES);
			return result;
		} catch (e) {
			// FIXME: dirty work around for showing some correct data during short demo.
			if (defaultData) {
				return defaultData;
			}

			throw `${e?.detail || e}`;
		}
	}, [defaultData, id]);

	const {
		data: latestData,
		isRefreshing: isRetuning,
		error: tuneUpError,
		refresh: retune,
		reset: clearLatestData
	} = useRefreshableState<API.Response.Classification>(undefined, refreshCallback);

	const handleResetBtnClick = useCallback(() => {
		// clear the graph
		if (latestData) {
			setPreviousData({ ...latestData });
			clearLatestData();
		} else {
			console.error('no data to reset to');
		}
	}, [setPreviousData, latestData, clearLatestData]);

	const handleStateDiscBtnClick = useCallback(() => {
		if (latestData) {
			setPreviousData({ ...latestData });
		}

		retune();
	}, [retune, latestData]);

	// at the start when previous data is not set, set it to uncalibrated data
	useEffect(() => {
		if (!previousData && untunedData) {
			setPreviousData({ ...untunedData });
		}
	}, [previousData, untunedData, setPreviousData]);

	useEffect(() => {
		if (!currentQubit) {
			try {
				// @ts-expect-error
				const firstQubit = Object.keys(previousData.classification).sort()[0];
				setCurrentQubit(firstQubit);
			} catch (error) {
				// console.error(error);
			}
		}
	}, [previousData, currentQubit, setCurrentQubit]);

	return (
		<Flex
			flexDir='column'
			flex='1'
			mt='8'
			bg='white'
			id='calibration-detail'
			borderRadius='md'
			boxShadow='lg'
		>
			<DefaultSkeleton isLoading={!previousData} error={undefined}>
				<Toolbar
					data={previousData}
					currentQubit={currentQubit}
					onReclassify={handleStateDiscBtnClick}
					onReset={handleResetBtnClick}
					isRecalculating={isRetuning}
				/>
			</DefaultSkeleton>

			<Divider />
			<Flex justifyContent='space-between' w='full' position='relative'>
				<StateDiscCard
					title='Before tune-up'
					isLoading={!previousData}
					error={undefined}
					data={previousData}
					currentQubit={currentQubit}
					boxStyle={{ borderRightWidth: 'thin', borderRightColor: 'gray.200' }}
				/>
				<StateDiscCard
					title='After tune-up'
					isLoading={isRetuning}
					error={tuneUpError}
					data={latestData}
					currentQubit={currentQubit}
				/>
			</Flex>
		</Flex>
	);
};

TuneUpPage.getInitialProps = async (ctx) => ({ id: await ctx.query.id });

export default TuneUpPage;
