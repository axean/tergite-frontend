import React from 'react';
import { useQuery } from 'react-query';
import Histogram from './Histogram';

interface HistogramVisualizationProps {}

export const HistogramVisualization: React.FC<HistogramVisualizationProps> = ({}) => {
	const { isLoading, data, error } = useQuery('backendOverview', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/pingu').then((res) => res.json())
	);
    
    


	if (isLoading) return <span>'Loading...'</span>;

	if (error) return <span>Error</span>;

	console.log(data);

	const t1data = data.qubits.map((qubit) => ({
		x: qubit.dynamic_properties[0].value * 1000000
	}));
	console.log(t1data);

	return (<Histogram data={t1data}></Histogram>);
};
