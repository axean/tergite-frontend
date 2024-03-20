import { Flex } from '@chakra-ui/react';
import { useQuery } from 'react-query';
import Graph3D from 'react-graph3d-vis';
import { getType5DeviceData } from '@/utils/api';

export default function CityPlotTab({ backend }: Props) {
	const data1: any[] = [];

	const { isLoading, error, data } = useQuery('QubitVisualization', () =>
		getType5DeviceData(`${backend}`)
	);

	if (isLoading || error) return <div> loading... </div>;

	if (data) {
		for (let k = 0; k < data.couplers.length; k = k + 1) {
			for (let m = 0; m < Object.keys(data.couplers[k]).length; m = m + 1) {
				if (k != m) {
					data1.push({
						x: k,
						y: m,
						z: data.couplers[k]['xtalk_{' + k + ',' + m + '}'][0].value
					});
				}
			}
		}
	}

	return (
		<Flex flexDir='column' alignItems='center'>
			<Graph3D
				data={data1}
				options={{
					width: '800px',
					height: '650px',
					style: 'bar',
					tooltip: true,
					keepAspectRatio: true,
					verticalRatio: 1,
					animationInterval: 1,
					animationPreload: true,
					xLabel: 'i',
					yLabel: 'j',
					zLabel: 'xtalk(i,j)',
					cameraPosition: {
						distance: 3
					}
				}}
			/>
		</Flex>
	);
}

interface Props {
	backend: string | string[];
}
