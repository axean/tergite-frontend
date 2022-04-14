import React from 'react';
import { VictoryAxis, VictoryChart, VictoryBoxPlot, VictoryLabel } from 'victory';

interface boxPlotElementShape {
	x: number;
	y: number[];
}

interface BoxPlotProps {
	data: boxPlotElementShape[];
}

const BoxPlot: React.FC<BoxPlotProps> = ({ data }) => {
	return (
		<VictoryChart>
			<VictoryLabel
				x={400}
				y={280}
				textAnchor={'middle'}
				text={'qubit index'}
				style={[{ fill: '#374151', fontSize: 12 }]}
			/>
			<VictoryAxis
				tickCount={7}
				style={{
					axis: { stroke: '#9CA3AF', strokeDasharray: '8' },
					tickLabels: { fontSize: 12, padding: 5, fill: '#9CA3AF' },
					grid: { stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '8' }
				}}
			/>
			<VictoryAxis
				dependentAxis
				style={{
					axis: { stroke: '#9CA3AF', strokeDasharray: '8' },
					tickLabels: { fontSize: 12, padding: 5, fill: '#9CA3AF' },
					grid: { stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '8' }
				}}
			/>

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
};
export default BoxPlot;

