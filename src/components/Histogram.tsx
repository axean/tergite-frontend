import React from 'react';
import { useQuery } from 'react-query';
import { VictoryChart, VictoryHistogram,  } from 'victory';

interface HistogramProps {
}


const Histogram: React.FC<HistogramProps> = ({}) => {
	const { isLoading, data, error } = useQuery('backendOverview', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/pingu').then((res) => res.json())
	);
    if (isLoading) return 'Loading...';

	if (error) return 'Error, prob no devices found';

    console.log(data)
    //console.log(data.qubits.map(qubit => ({x: qubit.dynamic_properties[0].value})))

   // const t1data = data.qubits.map(qubit => ({x: qubit.dynamic_properties[0].value}));

        return (<VictoryChart
            domainPadding={10}
          >
            <VictoryHistogram
              style={{ data: { fill: "#c43a31" } }}
              data={data.qubits.map(qubit => ({x: qubit.dynamic_properties[0].value}))}
            />
          </VictoryChart>);

 };

 export default Histogram;

