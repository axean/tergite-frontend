import { Stack } from '@chakra-ui/react';
import React, { useMemo } from 'react';
import { VictoryChart, VictoryScatter, VictoryTheme } from 'victory';
import ColoredPoint from './components/ColoredPoint';

export default function ScatterPlot({ preTaggedResults, currentResults }: Props) {
	const data = useMemo(() => {
		return [
			...(preTaggedResults?.results || []).map((v) => ({ ...v, size: 0, opacity: 0.3 })),
			...(currentResults?.results || []).map((v) => ({ ...v, size: 15, opacity: 1 }))
		];
	}, [preTaggedResults, currentResults]);

	return (
		<Stack>
			<VictoryChart
				domainPadding={20}
				theme={VictoryTheme.material}
				width={1080}
				height={810}
			>
				<VictoryScatter data={data} x='x' y='y' dataComponent={<ColoredPoint />} />
			</VictoryChart>
		</Stack>
	);
}

interface Props {
	preTaggedResults: API.Response.MLExperiment;
	currentResults: API.Response.MLExperiment;
}
