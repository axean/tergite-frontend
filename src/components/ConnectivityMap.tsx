import { Box, Text } from '@chakra-ui/react';

import { Grid } from '@visx/grid';
import { DefaultNode, Graph } from '@visx/network';
import { scaleLinear } from '@visx/scale';
import { ParentSize } from '@visx/responsive';
import React, { useEffect, useMemo } from 'react';
import { Group } from '@visx/group';
import { AxisBottom, AxisLeft, AxisRight } from '@visx/axis';
import { localPoint } from '@visx/event';

interface Node {
	x: number;
	y: number;
}
interface Link {
	source: Node;
	target: Node;
}
interface Data {
	nodes: Node[];
	links: Link[];
}

interface ConnectivityMapProps {
	data: Data;
	backgroundColor?: string;
	borderRadius?: number;
	nodeColor?: string;
	linkColor?: string;
}

const Square = ({ children }) => {
	return (
		<ParentSize>
			{({ width, height }) => (
				<Box w={width + 'px'} height={width + 'px'}>
					{children}{' '}
				</Box>
			)}
		</ParentSize>
	);
};
const ConnectivityMap: React.FC<ConnectivityMapProps> = ({ data, backgroundColor }) => {
	return (
		<Square>
			<Box bg='gray.200' borderRadius='md' p='4' w='full' h='full'>
				<ParentSize>
					{({ width, height }) => (
						<VisxChart
							data={data}
							height={height}
							width={width}
							backgroundColor={backgroundColor}
						/>
					)}
				</ParentSize>
			</Box>
		</Square>
	);
};

const VisxChart = ({ data, height, width, backgroundColor }) => {
	const xMargin = 25;
	const yMargin = 35;
	const yMax = height - yMargin;
	const xMax = width - xMargin;
	const xScale = scaleLinear({
		domain: [0, 5], // x-coordinate data values
		range: [0, xMax], // svg x-coordinates, svg x-coordinates increase left to right
		round: true
	});

	const yScale = scaleLinear({
		domain: [0, 5], // x-coordinate data values
		range: [yMax, 0], // svg x-coordinates, svg x-coordinates increase left to right
		round: true
	});

	const [pos, setPos] = React.useState({ x: 0, y: 0 });
	return (
		xMax > 0 &&
		yMax > 0 && (
			<svg width={width} height={height} rx={14}>
				<Group left={yMargin} top={10}>
					<Graph
						graph={{
							nodes: data.nodes.map(({ x, y }) => {
								return { x: x * (xMax / 10), y: y * (yMax / 10) };
							}),
							links: data.links
						}}
						nodeComponent={({ node: { x, y } }) => (
							<Group top={yMax / 20} left={xMax / 20}>
								<rect
									x={x}
									y={y}
									width={xMax / 10}
									height={yMax / 10}
									fill={x === pos.x && y === pos.y ? '#38B2AC' : '#366361'}
									stroke={x === pos.x && y === pos.y ? '#66FFF7' : '#366361'}
									strokeWidth={2}
									onMouseDown={(e) => {
										setPos({ x, y });
									}}
									onMouseEnter={(e) => {
										e.currentTarget.setAttribute('fill', '#38B2AC');
										e.currentTarget.setAttribute('stroke', '#66FFF7');
									}}
									onMouseLeave={(e) => {
										if (x !== pos.x || y !== pos.y) {
											e.currentTarget.setAttribute('fill', '#366361');
											e.currentTarget.setAttribute('stroke', '#366361');
										}
									}}
								/>
							</Group>

							// <DefaultNode fill={'#366361'} x={x} y={y}></DefaultNode>
						)}
						linkComponent={() => <></>}
					></Graph>
					<Grid
						xScale={xScale}
						yScale={yScale}
						width={xMax}
						height={yMax}
						numTicksColumns={5}
						numTicksRows={5}
						stroke='#ccc'
						rx={14}
					/>
					<AxisBottom scale={xScale} top={yMax} orientation='bottom' numTicks={5} />
					<AxisLeft scale={yScale} orientation='left' numTicks={5} />
				</Group>
			</svg>
		)
	);
};

export default ConnectivityMap;
