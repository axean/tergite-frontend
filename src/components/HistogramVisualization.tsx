import React, { useState } from 'react';
import { useQuery } from 'react-query';
import Histogram from './Histogram';

interface HistogramVisualizationProps {}

export const HistogramVisualization: React.FC<HistogramVisualizationProps> = ({}) => {
	const { isLoading, data, error } = useQuery('backendOverview', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/pingu').then((res) => res.json())
	);

	const [dataToVisualize, setDataToVisualize] = useState<'t1' | 't2' | 'tphi'>();
	const [timeSpan, setTimeSpan] = useState<Date>();

	if (isLoading) return <span>'Loading...'</span>;

	if (error) return <span>Error</span>;

	const t1Data = data.qubits.map((qubit) => ({
		x: qubit.dynamic_properties[0].value * 1000000
	}));

	const t2Data = data.qubits.map((qubit) => ({
		x: qubit.dynamic_properties[1].value * 1000000
	}));

	const tPhiData = data.qubits.map((qubit) => ({
		x: qubit.dynamic_properties[2].value * 1000000
	}));

	return <Histogram data={t1Data} label='T1(us)'></Histogram>;
};
