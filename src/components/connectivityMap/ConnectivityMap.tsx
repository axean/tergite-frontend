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

type ConnectivityMapProps = {
	data: Data;
	type: 'node' | 'link';
	hideLabels?: boolean;
	smallTicks?: boolean;
	size: number;
	squareSize?: 'small' | 'medium' | 'large';
	onSelect?: (id: number) => void;
	backgroundColor?: string;
	borderRadius?: number;
	nodeColor?: string;
	linkColor?: string;
};

const ConnectivityMap: React.FC<ConnectivityMapProps> = (props) => {
	return (
		<Box
			bg={props.backgroundColor ? props.backgroundColor : 'gray.200'}
			borderRadius='md'
			px='0'
			py='0'
			overflow='hidden'
		>
			<ParentSize>
				{({ width }) => <VisxChart {...props} height={width} width={width} />}
			</ParentSize>
		</Box>
	);
};

type VisxChartProps = ConnectivityMapProps & {
	height: number;
	width: number;
};

const VisxChart: React.FC<VisxChartProps> = ({
	data,
	height,
	width,
	size,
	hideLabels,
	smallTicks,
	squareSize,
	onSelect,
	type
}) => {
	const marginX = 25;
	const marginY = 25;
	const maxY = height - marginY;
	const maxX = width - marginX;
	const scaleX = useMemo(
		() =>
			scaleLinear({
				domain: [0, size],
				range: [0, maxX],
				round: true
			}),
		[maxX, size]
	);

	const scaleY = useMemo(
		() =>
			scaleLinear({
				domain: [size, 0],
				range: [0, maxY],
				round: true
			}),
		[maxY, size]
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

	return (
		maxX > 0 &&
		maxY > 0 && (
			<svg width={width} height={height} rx={14}>
				<Group left={marginX} top={0}>
					<Grid
						xScale={scaleX}
						yScale={scaleY}
						width={maxX}
						height={maxY}
						numTicksColumns={size}
						numTicksRows={size}
						stroke='#f0f0f0'
						rx={14}
					/>
					<AxisBottom
						scale={scaleX}
						top={maxY}
						orientation='bottom'
						numTicks={size}
						tickTransform={`translate(${maxX / 10} 0)`}
						tickFormat={(d) => (d.toString() === size.toString() ? '' : d.toString())}
						tickClassName={smallTicks ? 'tspan-sm' : 'tspan-md'}
						hideTicks={true}
					/>
					<AxisLeft
						scale={scaleY}
						orientation='left'
						numTicks={size}
						tickTransform={`translate(0 -${maxY / 10})`}
						hideTicks={true}
						tickClassName={smallTicks ? 'tspan-sm' : 'tspan-md'}
						tickFormat={(d) => (d.toString() === size.toString() ? '' : d.toString())}
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
									onSelect={onSelect}
									hideLabels={hideLabels}
									squareSize={squareSize}
									id={id}
								/>
							)
						}
						linkComponent={(link) =>
							type === 'link' && (
								<CustomLink
									link={link}
									xMax={maxX}
									yMax={maxY}
									onSelect={onSelect}
								/>
							)
						}
					></Graph>
				</Group>
			</svg>
		)
	);
};

type SmallConnectivityMapProps = Omit<
	ConnectivityMapProps,
	'smallTicks' | 'hideLabels' | 'squareSize'
>;
const SmallConnectivityMap: React.FC<SmallConnectivityMapProps> = (props) => {
	return <ConnectivityMap {...props} smallTicks={true} hideLabels={true} squareSize='large' />;
};
export default ConnectivityMap;
export { SmallConnectivityMap };
