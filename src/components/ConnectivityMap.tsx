import { Box } from '@chakra-ui/react';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { Grid } from '@visx/grid';
import { Group } from '@visx/group';
import { Graph } from '@visx/network';
import { ParentSize } from '@visx/responsive';
import { scaleLinear } from '@visx/scale';
import { Text } from '@visx/text';
import React, { useMemo } from 'react';

interface Node {
	x: number;
	y: number;
}
interface Link {
	source: Node;
	target: Node;
	vertical: boolean;
}

interface Data {
	nodes: Node[];
	links: Link[];
}

interface ConnectivityMapProps {
	data: Data;
	type: 'node' | 'link';
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
const ConnectivityMap: React.FC<ConnectivityMapProps> = ({ data, backgroundColor, type }) => {
	return (
		<Square>
			<Box bg='gray.200' borderRadius='md' p='4' w='full' h='full'>
				<ParentSize>
					{({ width, height }) => (
						<VisxChart
							data={data}
							height={height}
							width={width}
							type={type}
							backgroundColor={backgroundColor}
						/>
					)}
				</ParentSize>
			</Box>
		</Square>
	);
};

type VisxChartProps = {
	data: Data;
	height: number;
	width: number;
	backgroundColor: string;
	type: 'node' | 'link';
};

type CustomLinkProps = {
	link: Link;
	yMax: number;
	xMax: number;
};

const CustomLink: React.FC<CustomLinkProps> = ({ link, yMax, xMax }) => {
	console.log('from', link.source);
	return (
		<Group top={-yMax / 10} left={xMax / 10}>
			{' '}
			<line
				onMouseEnter={(e) => {
					e.currentTarget.setAttribute('stroke', '#38B2AC');
				}}
				onMouseLeave={(e) => {
					e.currentTarget.setAttribute('stroke', '#366361');
				}}
				x1={`${link.source.x}`}
				y1={`${link.source.y}`}
				x2={`${link.target.x}`}
				y2={`${link.target.y}`}
				strokeWidth={16}
				stroke='#366361'
			></line>
			{/* <DefaultLink link={link}></DefaultLink> */}
		</Group>
	);
};

const VisxChart: React.FC<VisxChartProps> = ({ data, height, width, backgroundColor, type }) => {
	const marginX = 45;
	const marginY = 45;
	const maxY = height - marginY;
	const maxX = width - marginX;
	const scaleX = scaleLinear({
		domain: [0, 5], // x-coordinate data values
		range: [0, maxX], // svg x-coordinates, svg x-coordinates increase left to right
		round: true
	});

	const scaleY = scaleLinear({
		domain: [5, 0], // x-coordinate data values
		range: [0, maxY], // svg x-coordinates, svg x-coordinates increase left to right
		round: true
	});

	const [pos, setPos] = React.useState({ x: 0, y: 0 });
	const newData = useMemo(
		() =>
			data.nodes.map(({ x, y }) => {
				return { x: scaleX(x / 2), y: scaleY(1 - y / 2) - maxY / 2 };
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
					<AxisBottom scale={scaleX} top={maxY} orientation='bottom' numTicks={6} />
					<AxisLeft scale={scaleY} orientation='left' numTicks={5} />
					<Graph
						graph={{
							nodes: newData,
							links: newLinks
						}}
						nodeComponent={({ node: { x, y } }) =>
							type === 'node' && (
								<CustomNode
									yMax={maxY}
									xMax={maxX}
									x={x}
									y={y}
									setPos={setPos}
									pos={pos}
								/>
							)
						}
						linkComponent={(link) =>
							type === 'link' ? (
								<CustomLink link={link.link} xMax={maxX} yMax={maxY} />
							) : (
								<></>
							)
						}
					></Graph>
				</Group>
			</svg>
		)
	);
};

type CustomNodeProps = {
	yMax: number;
	xMax: number;
	x: number;
	y: number;
	setPos: React.Dispatch<Node>;
	pos: Node;
};

const CustomNode: React.FC<CustomNodeProps> = ({ yMax, xMax, x, y, setPos, pos }) => {
	return (
		// yMax / 20 centers the qubit in the middle of the square, if removed its placed in the top left corner
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
					setPos({
						x,
						y
					});
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
			<Text
				x={x + 2}
				y={y + 12}
				fill='#f0f0f0'
				verticalAnchor='start'
				textAnchor='start'
				scaleToFit='shrink-only'
				width={(xMax / 10) * 0.9}
			>
				{`${Math.floor(x)},${Math.floor(y)}`}
			</Text>
		</Group>
	);
};

export default ConnectivityMap;
