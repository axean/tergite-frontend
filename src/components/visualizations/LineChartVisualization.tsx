import { Box, Flex, FormLabel, Select } from '@chakra-ui/react';
import { useQuery } from 'react-query';
import { ParentSize } from '@visx/responsive';
import { useEffect, useState } from 'react';
import LineChart from '../lineChart/LineChart';
import RadioButtons from '../RadioButtons';
import { ApiRoutes } from '../../utils/apiClient';

export interface LineData {
	x: number;
	y: number;
}

const LineChartVisualization = ({ backend }) => {
	const domainQuery = useQuery('linechartDomain', () =>
		fetch(`${ApiRoutes.devices}/${backend}/type4_domain`)
			.then((res) => res.json())
			.then((json) => {
				let keys = Object.keys(json);
				keys.forEach((key, index) => {
					if (json[key].length === 0) {
						delete json[key];
						keys.splice(index, 1);
					}
				});

				setDomain(json);
				setDomTabs(keys);
				setTabDom(keys[0]);
				// sets the first property of the first component as domain property
				// this style of set state is needed due to stale closures
				setActiveParams((oldVal) => {
					return {
						coDomain: oldVal.coDomain,
						domain: Object.keys(json[keys[0]][0])[0]
					};
				});
			})
	);

	const coDomainQuery = useQuery('linechartCodomain', () =>
		fetch(`${ApiRoutes.devices}/${backend}/type4_codomain`)
			.then((res) => res.json())
			.then((json) => {
				let keys = Object.keys(json);
				// remove empty objects
				keys.forEach((key, index) => {
					if (json[key].length === 0) {
						delete json[key];
						keys.splice(index, 1);
					}
				});

				setCoDomain(json);
				setCoDomTabs(keys);
				setTabCo(keys[0]);
				// sets the first property of the first component as codomain property
				// this style of set state is needed due to stale closures
				setActiveParams((oldVal) => {
					console.log('old val', oldVal);
					return {
						coDomain: Object.keys(json[keys[0]][0])[0],
						domain: oldVal.domain
					};
				});
			})
	);

	const [domTabs, setDomTabs] = useState<string[]>([]);
	const [coDomTabs, setCoDomTabs] = useState<string[]>([]);
	const [tabDom, setTabDom] = useState<string>('');
	const [tabCo, setTabCo] = useState<string>('');
	const [activeParams, setActiveParams] = useState<{ domain: string; coDomain: string }>({
		domain: '',
		coDomain: ''
	});
	const [domain, setDomain] = useState<string[]>();
	const [coDomain, setCoDomain] = useState<string[]>();
	const [lineData, setLineData] = useState<LineData[]>();

	useEffect(() => {
		if (
			tabDom.length > 0 &&
			tabCo.length > 0 &&
			domain &&
			coDomain &&
			activeParams.domain &&
			activeParams.coDomain
		) {
			let data = [];
			for (let i = 0; i < 5; i++) {
				data.push({
					x: domain[tabDom][i][activeParams.domain][0]?.value,
					y: coDomain[tabCo][i][activeParams.coDomain][0]?.value
				});
			}
			setLineData(data);
		}
	}, [activeParams.domain, activeParams.coDomain, tabCo, tabDom, domain, coDomain, activeParams]);

	if (domainQuery.isLoading || coDomainQuery.isLoading) return <span>Loading...</span>;

	if (domainQuery.error || coDomainQuery.error) return <span>Error</span>;

	if (domainQuery.isFetching || coDomainQuery.isFetching) return <span>is fetching</span>;

	return (
		<>
			<Box p={'32px'}>
				<Flex pb={'16px'} alignItems='center'>
					<FormLabel id='domain-label' fontSize={'large'}>
						{' '}
						Domain:{' '}
					</FormLabel>
					<RadioButtons
						id='domain-radio-btns'
						tabs={domTabs}
						setTab={(tab) => {
							setTabDom(() => {
								setActiveParams((oldVal) => {
									return {
										coDomain: oldVal.coDomain,
										domain: Object.keys(domain[tab][0])[0]
									};
								});
								return tab;
							});
						}}
					/>
					<Select
						id='domain-select'
						onChange={(e) => {
							console.log(e.target.value);
							setActiveParams({
								domain: e.target.value,
								coDomain: activeParams.coDomain
							});
						}}
					>
						{domain[tabDom][0] &&
							Object.keys(domain[tabDom][0]).map((key, index) => {
								if (key !== 'id') return <option key={index}> {key} </option>;
							})}
					</Select>
				</Flex>
				<Flex alignItems='center'>
					<FormLabel id='codomain-label' fontSize={'large'}>
						{' '}
						Codomain:{' '}
					</FormLabel>
					<RadioButtons
						id='codomain-radio-btns'
						tabs={coDomTabs}
						setTab={(tab) => {
							setTabCo(() => {
								setActiveParams((oldVal) => {
									return {
										domain: oldVal.domain,
										coDomain: Object.keys(coDomain[tab][0])[0]
									};
								});
								return tab;
							});
						}}
					/>
					<Select
						id='codomain-select'
						onChange={(e) => {
							setActiveParams({
								domain: activeParams.domain,
								coDomain: e.target.value
							});
						}}
					>
						{coDomain[tabCo][0] &&
							Object.keys(coDomain[tabCo][0]).map((key, index) => {
								if (key !== 'id') return <option key={index}> {key} </option>;
							})}
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
