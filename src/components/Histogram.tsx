import React from 'react';
import { useQuery } from 'react-query';
import { VictoryAxis, VictoryChart, VictoryHistogram, VictoryLabel } from 'victory';

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
		<VictoryChart domainPadding={10}>
            <VictoryLabel
                x={400}
                y={290}
                textAnchor={'middle'}
                text={'T1(us)'}
                />
			<VictoryHistogram
				cornerRadius={5}
                binSpacing={3}
				style={{
					data: {
						fill: '#9CE0DD',
                        stroke: 0
					}
				}}
				data={data.qubits.map((qubit) => ({ x: qubit.dynamic_properties[0].value * 1000000 }))}
			/>
		</VictoryChart>
	);
};

export default Histogram;

