import { Box } from '@chakra-ui/react';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { Grid } from '@visx/grid';
import { Group } from '@visx/group';
import { Graph } from '@visx/network';
import { ParentSize } from '@visx/responsive';
import { scaleLinear } from '@visx/scale';
import { Text } from '@visx/text';
import React, { useMemo, useState } from 'react';

import CustomNode from './CustomNode';
import CustomLink from './CustomLink';

import { useQuery } from 'react-query';

interface ConnectivityMapProps {
	data: Data;
	type: 'node' | 'link';
	hideLabels?: boolean;
	onSelectNode?: (id: number) => void;
	onSelectLink?: (id: number) => void;
	backgroundColor?: string;
	borderRadius?: number;
	nodeColor?: string;
	linkColor?: string;
}

const ConnectivityMap: React.FC<ConnectivityMapProps> = (props) => {
	return (
		<Box bg='gray.200' borderRadius='md' p='4' w='full' h='full'>
			<ParentSize>
				{({ width }) => <VisxChart {...props} height={width} width={width} />}
			</ParentSize>
		</Box>
	);
};

interface VisxChartProps extends ConnectivityMapProps {
	height: number;
	width: number;
}

const VisxChart: React.FC<VisxChartProps> = ({
	data,
	height,
	width,
	backgroundColor,
	hideLabels: hideLabels,
	type,
	onSelectNode,
	onSelectLink
}) => {
	const marginX = 45;
	const marginY = 45;
	const maxY = height - marginY;
	const maxX = width - marginX;
	const scaleX = useMemo(
		() =>
			scaleLinear({
				domain: [0, 5],
				range: [0, maxX],
				round: true
			}),
		[maxX]
	);

	const scaleY = useMemo(
		() =>
			scaleLinear({
				domain: [5, 0],
				range: [0, maxY],
				round: true
			}),
		[maxY]
	);

	const newData = useMemo(
		() =>
			data.nodes.map(({ x, y, id }) => {
				return { x: scaleX(x / 2), y: scaleY(y / 2 + 0.5) - maxY / 2, id };
			}),
		[data.nodes, scaleX, scaleY, maxY]
	);
	const newLinks = useMemo(
		() =>
			data.links.map(({ source, target, vertical }) => {
				return {
					source: {
						x: vertical ? scaleX(source.x) : scaleX(source.x - 0.15),
						y: vertical ? scaleY(source.y - 0.15) : scaleY(source.y)
					},
					target: {
						x: vertical ? scaleX(target.x) : scaleX(target.x + 0.15),
						y: vertical ? scaleY(target.y + 0.15) : scaleY(source.y)
					}
				};
			}),
		[data.links, scaleX, scaleY]
	);

	const [selectedNode, setSelectedNode] = useState<number>(-1);
	const [selectedLink, setSelectedLink] = useState<number>(-1);
	return (
		maxX > 0 &&
		maxY > 0 && (
			<svg width={width} height={height} rx={14}>
				<Group left={marginY} top={10}>
					<Grid
						xScale={scaleX}
						yScale={scaleY}
						width={maxX}
						height={maxY}
						numTicksColumns={5}
						numTicksRows={5}
						stroke='#ccc'
						rx={14}
					/>
					<AxisBottom
						scale={scaleX}
						top={maxY}
						orientation='bottom'
						numTicks={5}
						tickTransform={`translate(${maxX / 10} 0)`}
						tickFormat={(d) => d.toString()}
						hideTicks={true}
					/>
					<AxisLeft
						scale={scaleY}
						orientation='left'
						numTicks={5}
						tickTransform={`translate(0 -${maxY / 10})`}
						hideTicks={true}
						tickClassName=''
						tickFormat={(d) => d.toString()}
					/>
					<Graph
						graph={{
							nodes: newData,
							links: newLinks
						}}
						nodeComponent={({ node: { x, y, id } }) =>
							type === 'node' && (
								<CustomNode
									yMax={maxY}
									xMax={maxX}
									x={x}
									y={y}
									setSelectedNode={setSelectedNode}
									hideLabels={hideLabels}
									selectedNode={selectedNode}
									id={id}
									onSelect={onSelectNode}
								/>
							)
						}
						linkComponent={(link) =>
							type === 'link' ? (
								<></>
							) : (
								// <CustomLink
								// 	link={link.link}
								// 	xMax={maxX}
								// 	yMax={maxY}
								// 	onSelect={onSelectLink}
								// />
								<></>
							)
						}
					></Graph>
				</Group>
			</svg>
		)
	);
};

export default ConnectivityMap;
