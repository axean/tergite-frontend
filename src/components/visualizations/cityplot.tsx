import { Flex, Box, Spinner, Grid, Skeleton } from '@chakra-ui/react';
import { useContext, useEffect, useRef, useState } from 'react';
import { useQuery } from 'react-query';
import { BackendContext, MapActions } from '../../state/BackendContext';
import ConnectivityMap from '../connectivityMap/';
import Graph3D from 'react-graph3d-vis';
import ApiRoutes from '../../utils/ApiRoutes';

const Cityplot: React.FC<{ backend: any }> = ({ backend }) => {
	const data1 = [];

	const { isLoading, error, data } = useQuery(
		'QubitVisualization',
		async () => await fetch(`${ApiRoutes.devices}/${backend}/type5`).then((res) => res.json())
	);

	if (isLoading || error) return <div> loading... </div>;

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
};

export default Cityplot;
