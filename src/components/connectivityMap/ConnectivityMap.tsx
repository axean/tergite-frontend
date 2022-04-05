import { Box } from '@chakra-ui/react';
import { AxisBottom, AxisLeft } from '@visx/axis';
import { Grid } from '@visx/grid';
import { Group } from '@visx/group';
import { Graph } from '@visx/network';
import { ParentSize } from '@visx/responsive';
import { scaleLinear } from '@visx/scale';
import { Text } from '@visx/text';
import React, { useMemo } from 'react';
import { chakra } from '@chakra-ui/react';
import CustomNode from './CustomNode';
import CustomLink from './CustomLink';

interface ConnectivityMapProps {
	data: Data;
	type: 'node' | 'link';
	onSelectNode?: (id: string) => void;
	onSelectLink?: (id: string) => void;
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
const ConnectivityMap: React.FC<ConnectivityMapProps> = ({
	data,
	backgroundColor,
	type,
	onSelectNode,
	onSelectLink
}) => {
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
							onSelectLink={onSelectLink}
							onSelectNode={onSelectNode}
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
	onSelectNode: (id: string) => void;
	onSelectLink: (id: string) => void;
	type: 'node' | 'link';
};

const VisxChart: React.FC<VisxChartProps> = ({
	data,
	height,
	width,
	backgroundColor,
	type,
	onSelectNode,
	onSelectLink
}) => {
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
									onSelect={onSelectNode}
								/>
							)
						}
						linkComponent={(link) =>
							type === 'link' ? (
								<CustomLink
									link={link.link}
									xMax={maxX}
									yMax={maxY}
									onSelect={onSelectLink}
								/>
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

export default ConnectivityMap;
