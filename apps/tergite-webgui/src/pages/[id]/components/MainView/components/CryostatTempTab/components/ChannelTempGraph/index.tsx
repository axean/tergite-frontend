import { Stack } from '@chakra-ui/react';
import React from 'react';
import { useQuery } from 'react-query';
import {
	VictoryChart,
	VictoryLine,
	VictoryTheme,
	VictoryAxis,
	VictoryLabel,
	VictoryScatter,
	VictoryTooltip,
	VictoryVoronoiContainer
} from 'victory';
import { formatTemperatureTick, formatDatetimeTick } from './utils';
import DatetimeLabel from './components/DatetimeLabel';
import DefaultSkeleton from '../../../../../../../../components/primitives/DefaultSkeleton';
import GraphTitle from './components/GraphTitle/GraphTitle';
import { getIntervalCount, toToolTipText, getLatestTemperatureString } from './utils';
import { getCryostatTemperature } from '../../../../../../../../utils/api';

export const ChannelTempGraph = ({ backend, channel, startTimestamp, endTimestamp }: Props) => {
	let from_ = startTimestamp?.toISOString();
	let to_ = endTimestamp?.toISOString();
	const queryName = `device-${backend}-channel-${channel}-temperature-${from_}-${to_}`;

	const { isLoading, data, error } = useQuery(
		queryName,
		() => getCryostatTemperature(`${backend}`, channel, from_, to_),
		{ refetchInterval: 150_000 } // refresh every 2.5 minutes
	);

	const numberOf5MinIntervals = data && getIntervalCount(300_000, data);
	const latestTemperature = data && getLatestTemperatureString(data);

	return (
		<DefaultSkeleton isLoading={isLoading} error={error}>
			<Stack>
				<GraphTitle channel={channel} />

				{data && (
					<VictoryChart
						domainPadding={{ x: 0, y: 20 }}
						theme={VictoryTheme.material}
						scale={{ x: 'time', y: 'linear' }}
						padding={{ top: 0, bottom: 30, left: 50, right: 10 }}
						width={500}
						height={180}
						containerComponent={
							<VictoryVoronoiContainer
								voronoiBlacklist={['line-chart']}
								labels={({ datum }) => toToolTipText(datum)}
								labelComponent={
									<VictoryTooltip
										centerOffset={{ x: 5 }}
										constrainToVisibleArea
									/>
								}
							/>
						}
					>
						<VictoryAxis
							style={{
								tickLabels: { fontSize: 9, padding: 1 },
								axisLabel: { fontSize: 9, padding: 1 },
								grid: { strokeDasharray: 'none' }
							}}
							dependentAxis
							tickFormat={formatTemperatureTick}
							label='temperature (K)'
							axisLabelComponent={<VictoryLabel dy={-40} />}
						/>
						<VictoryAxis
							style={{
								tickLabels: { fontSize: 9, padding: 1 },
								grid: { strokeDasharray: 'none' }
							}}
							tickFormat={formatDatetimeTick}
							tickLabelComponent={<DatetimeLabel />}
							tickCount={numberOf5MinIntervals}
						/>

						<VictoryLine
							name='line-chart'
							data={data}
							x='datetime'
							y='temperature'
							interpolation='monotoneX'
							style={{ data: { strokeWidth: 1, stroke: 'rgb(47 133 90 / 50%)' } }}
						/>

						<VictoryScatter
							style={{ data: { fill: '#2F855A' } }}
							size={1}
							data={data}
							x='datetime'
							y='temperature'
						/>

						<VictoryLabel
							textAnchor='middle'
							style={{
								fontSize: 20,
								fill: 'rgb(69, 90, 100)'
							}}
							x={275}
							y={50}
							text={latestTemperature}
						/>
					</VictoryChart>
				)}
			</Stack>
		</DefaultSkeleton>
	);
};

interface Props {
	backend: string | string[];
	channel: number;
	startTimestamp?: Date;
	endTimestamp?: Date;
}
