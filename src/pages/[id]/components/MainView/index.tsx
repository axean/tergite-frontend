import { Flex } from '@chakra-ui/react';
import React, { useMemo } from 'react';
import Tabbar, { TabbarItemConfig } from './components/Tabbar';
import TableTab from './components/TableTab';
import CryostatTempTab from './components/CryostatTempTab';
import QubitTab from './components/QubitTab';
import HistogramTab from './components/HistogramTab';
import GateErrorTab from './components/GateErrorTab';
import LineChartTab from './components/LineChartTab';
import CityPlotTab from './components/CityPlotTab';

export default function MainView({ isFullscreen, onFullScreenToggleBtnClick, tab, device }: Props) {
	const allTabNames = useMemo(() => Object.values(Tabs).filter((k) => isNaN(Number(k))), []);
	const tabName = allTabNames.includes(tab) ? tab : Tabs.TABLE_VIEW;
	const deviceName = device?.backend_name;

	return (
		<Flex flexDir='column' flex='10' mx='2' borderRadius='md' gap='4'>
			<Tabbar
				items={TAB_LABELS}
				isFullScreen={isFullscreen}
				onFullScreenToggleBtnClick={onFullScreenToggleBtnClick}
			/>
			{tabName === Tabs.TABLE_VIEW && <TableTab backend={deviceName} />}
			{tabName === Tabs.CRYOSTAT_TEMP && <CryostatTempTab backend={deviceName} />}
			{tabName === Tabs.QUBIT_MAP && <QubitTab isCollapsed={isFullscreen} />}
			{tabName === Tabs.HISTOGRAM && <HistogramTab backend={deviceName} />}
			{tabName === Tabs.BOX_PLOT && <GateErrorTab backend={deviceName} />}
			{tabName === Tabs.LINE_GRAPH && <LineChartTab backend={deviceName} />}
			{tabName === Tabs.CITY_PLOT && <CityPlotTab backend={deviceName} />}
		</Flex>
	);
}

interface Props {
	isFullscreen: boolean;
	onFullScreenToggleBtnClick: () => void;
	tab: Tabs;
	device: API.Response.DeviceDetail;
}

export enum Tabs {
	TABLE_VIEW = 'table-view',
	CRYOSTAT_TEMP = 'cryostat-temperature',
	QUBIT_MAP = 'qubit-map',
	HISTOGRAM = 'histogram',
	BOX_PLOT = 'box-plot',
	LINE_GRAPH = 'line-graph',
	CITY_PLOT = 'city-plot'
}

const TAB_LABELS: Array<TabbarItemConfig> = [
	{
		label: 'Table view',
		href: Tabs.TABLE_VIEW
	},
	{
		label: 'Cryostat Temperature',
		href: Tabs.CRYOSTAT_TEMP
	},
	{
		label: 'Qubit Map',
		href: Tabs.QUBIT_MAP
	},
	{
		label: 'Histogram',
		href: Tabs.HISTOGRAM
	},
	{
		label: 'Box Plot',
		href: Tabs.BOX_PLOT
	},
	{
		label: 'City Plot',
		href: Tabs.CITY_PLOT
	},
	{
		label: 'Line Graph',
		href: Tabs.LINE_GRAPH
	}
];
