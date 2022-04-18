import { Box, Flex, FormLabel, Select } from '@chakra-ui/react';
import { useQuery } from 'react-query';
import { ParentSize } from '@visx/responsive';
import { useEffect, useState } from 'react';
import LineChart from '../lineChart/LineChart';
import RadioButtons from '../RadioButtons';

interface LineData {
	x: number;
	y: number;
}

const LineChartVisualization = ({ backend }) => {
	const domainQuery = useQuery('linechartDomain', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/' + backend + '/type4_domain')
			.then((res) => res.json())
			.then((json) => {
				setDomain(json);
				setDomTabs(Object.keys(json));
				setTabDom(Object.keys(json)[0]);
			})
	);

	const coDomainQuery = useQuery('linechartCodomain', () =>
		fetch('http://qtl-webgui-2.mc2.chalmers.se:8080/devices/' + backend + '/type4_codomain')
			.then((res) => res.json())
			.then((json) => {
				setCoDomain(json);
				setCoDomTabs(Object.keys(json));
				setTabCo(Object.keys(json)[0]);
			})
	);

	const [domTabs, setDomTabs] = useState<string[]>();
	const [coDomTabs, setCoDomTabs] = useState<string[]>();
	const [tabDom, setTabDom] = useState<string>();
	const [tabCo, setTabCo] = useState<string>();
	const [paramDom, setParamDom] = useState<string>();
	const [paramCo, setParamCo] = useState<string>();
	const [domain, setDomain] = useState<string[]>();
	const [coDomain, setCoDomain] = useState<string[]>();
	const [lineData, setLineData] = useState<LineData[]>([
		{ x: 0, y: 0 },
		{ x: 10, y: 12 },
		{ x: 30, y: 50 },
		{ x: 35, y: 55 },
		{ x: 100, y: 15 }
	]);

	useEffect(() => {
		if (domain && coDomain && paramDom && paramCo) {
			console.log(domain);
			console.log(coDomain);
			let data = [];
			for (let i = 0; i < 5; i++) {
				data.push({
					x: domain[tabDom][i][paramDom][0].value,
					y: coDomain[tabCo][i][paramCo][0].value
				});
			}
			setLineData(data);
		}
	}, [paramDom, paramCo]);

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

	if (domainQuery.isLoading || coDomainQuery.isLoading) return <span>Loading...</span>;

	if (domainQuery.error || coDomainQuery.error) return <span>Error</span>;

	if (domainQuery.isFetching || coDomainQuery.isFetching) return <span>is fetching</span>;

	return (
		<>
			<Box p={'32px'}>
				<Flex pb={'16px'} alignItems='center'>
					<FormLabel fontSize={'large'}> Domain: </FormLabel>
					<RadioButtons tabs={domTabs} setTab={setTabDom} />
					<Select
						onChange={(e) => {
							setParamDom(e.target.value);
						}}
					>
						{getParameters(domain, tabDom)}
					</Select>
				</Flex>
				<Flex alignItems='center'>
					<FormLabel fontSize={'large'}> Codomain: </FormLabel>
					<RadioButtons tabs={coDomTabs} setTab={setTabCo} />
					<Select
						onChange={(e) => {
							setParamCo(e.target.value);
						}}
					>
						{getParameters(coDomain, tabCo)}
					</Select>
				</Flex>
			</Box>
			<ParentSize>
				{({ width, height }) => <LineChart data={lineData} width={width} height={height} />}
			</ParentSize>
		</>
	);
};

export default LineChartVisualization;
