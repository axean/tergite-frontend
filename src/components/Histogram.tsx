import { Flex } from '@chakra-ui/react';
import { fill } from 'lodash';
import React from 'react';
import { useQuery } from 'react-query';
import {
	Box,
	LineSegment,
	VictoryAxis,
	VictoryChart,
	VictoryHistogram,
	VictoryLabel,
	VictoryTheme
} from 'victory';
import RadioButtons from './RadioButtons';

interface HistogramProps {}

const Histogram: React.FC<HistogramProps> = ({}) => {
	const { isLoading, data, error } = useQuery('backendOverview', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/pingu').then((res) => res.json())
	);
	if (isLoading) return <span>'Loading...'</span>;

	if (error) return <span>Error</span>;

	console.log(data);
	//console.log(data.qubits.map(qubit => ({x: qubit.dynamic_properties[0].value})))

	// const t1data = data.qubits.map(qubit => ({x: qubit.dynamic_properties[0].value}));

	return (
		<VictoryChart>
			<VictoryLabel x={400} y={280} textAnchor={'middle'} text={'T1(us)'}
			style= {[{fill: '#374151'}]} />
			<VictoryAxis
				tickCount={14}
				style={{
					axis: { stroke: '#9CA3AF', },
					tickLabels: { fontSize: 12, padding: 5, fill: '#9CA3AF' }
				}}
			/>
			<VictoryAxis
				dependentAxis
				style={{
					axis: { stroke: 0 },
					tickLabels: { fontSize: 12, padding: 5, fill: '#9CA3AF' },
					grid: { stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray:'8'}
				}}
			/>

			<VictoryHistogram
				cornerRadius={0}
				binSpacing={3}
				style={{
					data: {
						fill: '#9CE0DD',
						stroke: 0
					}
				}}
				data={data.qubits.map((qubit) => ({
					x: qubit.dynamic_properties[0].value * 1000000
				}))}
				//comment out hard coded bins to let d3 decide what the bins should be
				bins={[30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95]}
			/>
		</VictoryChart>
	);
};

export default Histogram;
