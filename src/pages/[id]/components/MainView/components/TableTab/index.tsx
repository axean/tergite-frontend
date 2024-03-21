import { Box } from '@chakra-ui/react';
import React, { useState } from 'react';
import CouplerTable from './components/CouplerTable';
import QubitTable from './components/QubitTable';
import ResonatorTable from './components/ResonatorTable';
import { useQuery } from 'react-query';
import { getDeviceTableData } from '@/utils/api';
import GateTable from './components/GateTable';
import RadioButtons from '@/components/primitives/RadioButtons';

const tabNames = ['Qubits', 'Gates', 'Couplers', 'Resonators'];

export default function TableTab({ backend }: Props) {
	const [tab, setTab] = useState('Qubits');
	const { isLoading, data, error } = useQuery('tableQuery', () =>
		getDeviceTableData(`${backend}`)
	);

	if (isLoading) return <span>Loading</span>;
	if (error) return <span>{error} + error</span>;

	return data ? (
		<Box bg='white' boxShadow='lg' p='2'>
			<RadioButtons setTab={setTab} tabs={tabNames} />
			{tab === 'Qubits' && <QubitTable data={data} />}
			{tab === 'Couplers' && <CouplerTable data={data} />}
			{tab === 'Resonators' && <ResonatorTable data={data} />}
			{tab === 'Gates' && <GateTable data={data} />}
		</Box>
	) : null;
}

interface Props {
	backend: string | string[];
}
