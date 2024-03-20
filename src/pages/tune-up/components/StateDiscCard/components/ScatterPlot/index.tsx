import { Stack } from '@chakra-ui/react';
import React, { useMemo } from 'react';
import { VictoryChart, VictoryLegend, VictoryScatter, VictoryTheme } from 'victory';
import ChartHeading from './components/ChartHeading';
import ColoredPoint from './components/ColoredPoint';

export default function ScatterPlot({ data, currentQubit }: Props) {
	const classificationData = useMemo<API.ClassificationMeasurement[]>(
		() => (data?.classification || {})[currentQubit] || [],
		[data, currentQubit]
	);

	return (
		<Stack height={`100%`} width={`100%`}>
			<ChartHeading />(
			<VictoryChart
				domainPadding={20}
				theme={VictoryTheme.material}
				width={675}
				height={675}
				padding={{ bottom: 125 }}
			>
				<VictoryLegend
					x={50}
					y={600}
					centerTitle
					orientation='horizontal'
					gutter={330}
					style={{
						border: { stroke: 'transparent', marginBottom: 200, width: 675 },
						labels: { fontSize: 20, fontWeight: 500 },
						parent: {
							marginTop: 200
						}
					}}
					data={[
						{ name: '|0>', symbol: { fill: 'red' } },
						{ name: '|1>', symbol: { fill: 'blue' } }
					]}
				/>
				{classificationData && (
					<VictoryScatter
						data={classificationData}
						x='I'
						y='Q'
						dataComponent={<ColoredPoint />}
					/>
				)}
			</VictoryChart>
			)
		</Stack>
	);
}

interface Props {
	data: API.Response.Classification;
	currentQubit: string;
}
