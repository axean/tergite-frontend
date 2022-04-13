import { Box, Flex, FormLabel, Select } from '@chakra-ui/react';
import { ParentSize } from '@visx/responsive';
import { useState } from 'react';
import LineChart from '../lineChart/LineChart';
import RadioButtons from '../RadioButtons';

const LineChartVisualization = () => {
	const tabsDom = ['Qubit', 'Resonator', 'Coupler', 'Gates'];
	const tabsCo = ['Qubit', 'Resonator', 'Coupler', 'Gates'];

	const [tabDom, setTabDom] = useState<string>();
	const [tabCo, setTabCo] = useState<string>();

	const domainOptions = ['Frequency (Hz)', 'Option 2', 'domain option'];
	const coDomainOptions = ['Frequency (Hz)', 'Option 2', 'co domain option'];

	const getParameters = (options: string[]) => {
		let parameters = options.map((data, id) => {
			return (
				<option key={id} value={data}>
					{data}
				</option>
			);
		});
		return parameters;
	};

	return (
		<Box>
			<Box p={'32px'}>
				<Flex pb={'16px'} alignItems='center'>
					<FormLabel fontSize={'large'}> Domain: </FormLabel>
					<RadioButtons tabs={tabsDom} setTab={setTabDom} />
					<Select>{getParameters(domainOptions)}</Select>
				</Flex>
				<Flex alignItems='center'>
					<FormLabel fontSize={'large'}> Codomain: </FormLabel>
					<RadioButtons tabs={tabsCo} setTab={setTabCo} />
					<Select>{getParameters(coDomainOptions)}</Select>
				</Flex>
			</Box>
			<ParentSize>
				{({ width, height }) => (
					<LineChart
						data={{ x: { minX: 0, maxX: 100 }, y: { minY: 0, maxY: 100 } }}
						width={width}
						height={width}
					/>
				)}
			</ParentSize>
		</Box>
	);
};

export default LineChartVisualization;
