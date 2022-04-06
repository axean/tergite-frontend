import { Box } from '@chakra-ui/react';
import React from 'react';
import Histogram from '../components/Histogram';

interface testProps {}

const test: React.FC<testProps> = ({}) => {
	return	<Box bg='white'><Histogram></Histogram></Box>;
};
export default test;
