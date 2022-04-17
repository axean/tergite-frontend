import { Box, Flex, FormLabel, Select } from '@chakra-ui/react';
import { useQuery } from 'react-query';
import { ParentSize } from '@visx/responsive';
import { useState } from 'react';
import LineChart from '../lineChart/LineChart';
import RadioButtons from '../RadioButtons';

const LineChartVisualization = ({ backend }) => {
	const domainData = useQuery('linechartDomain', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/' + backend + '/type4_domain')
			.then((res) => res.json())
			.then((json) => console.log(json))
	);

	const coDomainData = useQuery('linechartCodomain', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/' + backend + '/type4_codomain')
			.then((res) => res.json())
			.then((json) => console.log(json))
	);

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
		<>
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
						data={[
							{ x: 0, y: 0 },
							{ x: 10, y: 12 },
							{ x: 30, y: 50 },
							{ x: 35, y: 55 },
							{ x: 100, y: 15 }
						]}
						width={width}
						height={height}
					/>
				)}
			</ParentSize>
		</>
	);
};

export default LineChartVisualization;
