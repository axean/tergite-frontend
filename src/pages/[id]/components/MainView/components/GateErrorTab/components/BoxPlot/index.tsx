import React from 'react';
import { VictoryAxis, VictoryChart, VictoryBoxPlot, VictoryLabel } from 'victory';

export default function BoxPlot({ data }: Props) {
	return (
		<VictoryChart data-cy-box-plot>
			<VictoryLabel
				x={40}
				y={30}
				textAnchor={'middle'}
				text={'Gate error'}
				style={[{ fill: '#374151', fontSize: 12 }]}
			/>

			<VictoryLabel
				x={400}
				y={280}
				textAnchor={'middle'}
				text={'Qubit index'}
				style={[{ fill: '#374151', fontSize: 12 }]}
			/>
			{/* @ts-ignore-error */}
			<VictoryAxis
				tickCount={data.length}
				crossAxis={false}
				style={{
					axis: { stroke: '#9CA3AF', strokeDasharray: '8' },
					tickLabels: { fontSize: 12, padding: 5, fill: '#9CA3AF' },
					grid: { stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '8' }
				}}
			/>
			{/* @ts-ignore-error */}
			<VictoryAxis
				dependentAxis
				style={{
					axis: { stroke: 0 },
					tickLabels: { fontSize: 12, padding: 5, fill: '#9CA3AF' },
					grid: { stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '8' }
				}}
			/>

			{/* @ts-ignore-error */}
			<VictoryBoxPlot
				boxWidth={8}
				data={data}
				style={{
					min: { stroke: '#366361' },
					max: { stroke: '#38B2AC' },
					q1: { fill: '#366361' },
					q3: { fill: '#38B2AC' },
					median: { stroke: 'white', strokeWidth: 2 }
				}}
			></VictoryBoxPlot>
		</VictoryChart>
	);
}

interface Props {
	data: {
		x: number;
		y: number[];
	}[];
}
