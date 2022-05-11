import { Box } from '@chakra-ui/react';
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import RadioButtons from '../RadioButtons';
import CouplerTable from '../tableView/CouplerTable';
import GateTable from '../tableView/GateTable';
import QubitTable from '../tableView/QubitTable';
import ResonatorTable from '../tableView/ResonatorTable';

interface TableVisualizationProps {
	backend: string | string[];
}

const TableVisualization = ({ backend }: TableVisualizationProps) => {
	const [tab, setTab] = useState('Qubits');

	const { isLoading, data, error } = useQuery('backendOverview', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/' + backend + '/data').then((res) =>
			res.json()
		)
	);

	if (isLoading) return <span>Loading</span>;

	if (error) return <span>{error} + error</span>;

	return (
		<Box>
			<RadioButtons setTab={setTab} tabs={['Qubits', 'Gates', 'Couplers', 'Resonators']} />
			<Table table={tab} backend={backend} data={data} />
		</Box>
	);
};

const Table = ({ table, backend, data }) => {
	switch (table) {
		case 'Qubits':
			return <QubitTable data={data} />;
		case 'Gates':
			return <GateTable data={data} />;
		case 'Couplers':
			return <CouplerTable data={data} />;
		case 'Resonators':
			return <ResonatorTable data={data} />;
		default:
			return <QubitTable data={data} />;
	}
};

export default TableVisualization;
