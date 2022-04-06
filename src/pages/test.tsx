import { Box } from '@chakra-ui/react';
import React from 'react';
import Histogram from '../components/Histogram';
import { HistogramVisualization } from '../components/HistogramVisualization';

interface testProps {}

const test: React.FC<testProps> = ({}) => {
	return	<Box bg='white'><HistogramVisualization></HistogramVisualization></Box>;
};
export default test;
