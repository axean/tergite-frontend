import { Box, Flex, FormLabel, Select } from '@chakra-ui/react';
import { useQuery } from 'react-query';
import { ParentSize } from '@visx/responsive';
import { useState } from 'react';
import LineChart from '../lineChart/LineChart';
import RadioButtons from '../RadioButtons';

const LineChartVisualization = ({ backend }) => {
	const domainQuery = useQuery('linechartDomain', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/' + backend + '/type4_domain')
			.then((res) => res.json())
			.then((json) => {
				console.log(json);
				setDomTabs(Object.keys(json));
				setTabDom(Object.keys(json)[0]);
				setDomain(json);
			})
	);

	const coDomainQuery = useQuery('linechartCodomain', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/' + backend + '/type4_codomain')
			.then((res) => res.json())
			.then((json) => {
				setCoDomTabs(Object.keys(json));
				setTabCo(Object.keys(json)[0]);
				setCoDomain(json);
			})
	);

	const [domTabs, setDomTabs] = useState<string[]>();
	const [coDomTabs, setCoDomTabs] = useState<string[]>();
	const [domain, setDomain] = useState<string[]>();
	const [coDomain, setCoDomain] = useState<string[]>();
	const [tabDom, setTabDom] = useState<string>();
	const [tabCo, setTabCo] = useState<string>();
	const [lineData, setLineData] = useState<{ x: number; y: number }[]>();

	const getParameters = (options: string[], selectedTab: string) => {
		let parameters = [];
		if (options[selectedTab][0]) {
			parameters = Object.keys(options[selectedTab][0]).map((key, i) => {
				return (
					<option key={i} value={key}>
						{key}
					</option>
				);
			});
		}
		return parameters;
	};

	const getLineData = () => {};

	if (domainQuery.isLoading || coDomainQuery.isLoading) return <span>Loading...</span>;

	if (domainQuery.error || coDomainQuery.error) return <span>Error</span>;

	if (domainQuery.isFetching || coDomainQuery.isFetching) return <span>is fetching</span>;

	return (
		<>
			<Box p={'32px'}>
				<Flex pb={'16px'} alignItems='center'>
					<FormLabel fontSize={'large'}> Domain: </FormLabel>
					<RadioButtons tabs={domTabs} setTab={setTabDom} />
					<Select>{getParameters(domain, tabDom)}</Select>
				</Flex>
				<Flex alignItems='center'>
					<FormLabel fontSize={'large'}> Codomain: </FormLabel>
					<RadioButtons tabs={coDomTabs} setTab={setTabCo} />
					<Select>{getParameters(coDomain, tabCo)}</Select>
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
