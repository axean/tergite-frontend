import { Box, Flex, FormLabel, Select } from '@chakra-ui/react';
import { useQuery } from 'react-query';
import { ParentSize } from '@visx/responsive';
import { useEffect, useState } from 'react';
import LineChart from '../lineChart/LineChart';
import RadioButtons from '../RadioButtons';

export interface LineData {
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
	const [activeParams, setActiveParams] = useState<{ domain: string; coDomain: string }>({
		domain: '',
		coDomain: ''
	});
	const [domain, setDomain] = useState<string[]>();
	const [coDomain, setCoDomain] = useState<string[]>();
	const [lineData, setLineData] = useState<LineData[]>();

	useEffect(() => {
		console.log(activeParams);
		if (domain && coDomain && activeParams.domain && activeParams.coDomain) {
			let data = [];
			for (let i = 0; i < 5; i++) {
				data.push({
					x: domain[tabDom][i][activeParams.domain][0].value,
					y: coDomain[tabCo][i][activeParams.coDomain][0].value
				});
			}
			setLineData(data);
		}
	}, [activeParams.domain, activeParams.coDomain]);

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
						onClick={(e) => {
							setActiveParams({
								domain: e.target.value,
								coDomain: activeParams.coDomain
							});
						}}
					>
						{domain[tabDom][0] &&
							Object.keys(domain[tabDom][0]).map((key, index) => (
								<option key={index}> {key} </option>
							))}
					</Select>
				</Flex>
				<Flex alignItems='center'>
					<FormLabel fontSize={'large'}> Codomain: </FormLabel>
					<RadioButtons tabs={coDomTabs} setTab={setTabCo} />
					<Select
						onClick={(e) => {
							setActiveParams({
								domain: activeParams.domain,
								coDomain: e.target.value
							});
						}}
					>
						{coDomain[tabCo][0] &&
							Object.keys(coDomain[tabCo][0]).map((key, index) => (
								<option key={index}> {key} </option>
							))}
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
