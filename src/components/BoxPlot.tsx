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
		<VictoryChart
			//domain={{ x: [0, 4], y: [-20, 20] }}
			//singleQuadrantDomainPadding={{ x: false }}
			//domainPadding={{ x: 40 }} 
            >
			<VictoryAxis>
           
           </VictoryAxis>
			<VictoryAxis
            
            dependentAxis
            ></VictoryAxis>
			<VictoryBoxPlot minLabels maxLabels boxWidth={10} data={data}></VictoryBoxPlot>
		</VictoryChart>
	);
};
export default BoxPlot;

