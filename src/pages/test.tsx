import { Box } from '@chakra-ui/react';
import React from 'react';
import QubitTable from '../components/QubitTable';
import ResonatorTable from '../components/ResonatorTable';

const test = () => {
	return (
		<Box>
			<QubitTable />
			<ResonatorTable />
		</Box>
	);
};

export default test;
