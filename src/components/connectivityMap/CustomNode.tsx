import { Group } from '@visx/group';
import { Text } from '@visx/text';
import { useTooltip, useTooltipInPortal, defaultStyles } from '@visx/tooltip';
import { Box, Grid, GridItem } from '@chakra-ui/react';
import React, { useContext, useEffect, useRef } from 'react';
import { BackendContext, MapActions } from '../../state/BackendContext';

type CustomNodeProps = {
	id: number;
	x: number;
	y: number;
	yMax: number;
	xMax: number;
	onSelect?: (id: number) => void;
	squareSize: 'small' | 'medium' | 'large';
	hideLabels: boolean;
	data: Nullable<{
		allNodeData: API.ComponentData[];
		nodeData: {
			id: number;
			data?: API.Property[];
		};
	}>;
};

const CustomNode: React.FC<CustomNodeProps> = ({
	data,
	yMax,
	xMax,
	x,
	y,
	id,
	onSelect,
	squareSize,
	hideLabels
}) => {
	squareSize = squareSize || 'medium';
	let size = 0;
	switch (squareSize) {
		case 'small':
			size = yMax / 16;
			break;
		case 'medium':
			size = yMax / 10;
			break;
		case 'large':
			size = yMax / 7;
			break;
	}
	const { tooltipOpen, tooltipTop, tooltipLeft, hideTooltip, showTooltip, tooltipData } =
		useTooltip();

	let tooltipTimeout;

	const formattedValue =
		!hideLabels && data.nodeData.data
			? Math.abs(data.nodeData.data[0].value) > 9999
				? data.nodeData.data[0].value.toFixed(0)
				: data.nodeData.data[0].value.toFixed(3)
			: id;

	const [{ selectedNode }, dispatch] = useContext(BackendContext);

	const nodeRef = useRef(null);
	useEffect(() => {
		console.log(nodeRef.current.getBoundingClientRect());
	}, []);
	return (
		<Group
			top={yMax / 10 - size / 2}
			left={xMax / 10 - size / 2}
			onMouseEnter={(e) => {
				e.currentTarget.firstElementChild.setAttribute('fill', '#38B2AC');
				e.currentTarget.firstElementChild.setAttribute('stroke', '#66FFF7');
			}}
			onMouseLeave={(e) => {
				if (selectedNode !== id) {
					e.currentTarget.firstElementChild.setAttribute('fill', '#366361');
					e.currentTarget.firstElementChild.setAttribute('stroke', '#366361');
				}

				tooltipTimeout = window.setTimeout(() => {
					hideTooltip();
				}, 10);
			}}
			onMouseDown={() => {
				dispatch({ type: MapActions.SELECT_NODE, payload: id });
				onSelect && onSelect(id);
			}}
			style={{ cursor: 'pointer' }}
			onMouseMove={(event) => {
				// if (tooltipTimeout) clearTimeout(tooltipTimeout);
				const { top, left } = nodeRef.current.getBoundingClientRect();

				showTooltip({
					tooltipData: selectedNode,
					tooltipTop: top + 20,
					tooltipLeft: left + 20
				});
			}}
		>
			<rect
				ref={nodeRef}
				x={x}
				y={y}
				width={size}
				height={size}
				fill={selectedNode === id ? '#38B2AC' : '#366361'}
				stroke={selectedNode === id ? '#66FFF7' : '#366361'}
				strokeWidth={2}
			/>
			{!hideLabels && (
				<Text
					x={x + 2}
					y={y + 12}
					fill='#f0f0f0'
					verticalAnchor='start'
					textAnchor='start'
					scaleToFit='shrink-only'
					width={(xMax / 10) * 0.9}
				>
					{formattedValue}
				</Text>
			)}

			{tooltipOpen && tooltipData && data && (
				<ToolTip
					toolTipData={data.allNodeData.find((n) => n.id === id)}
					top={tooltipTop}
					left={tooltipLeft}
				/>
			)}
		</Group>
	);
};

type ToolTipProps = {
	toolTipData: API.ComponentData;
	top: number;
	left: number;
};
const ToolTip: React.FC<ToolTipProps> = ({ toolTipData, top, left }) => {
	const keys = Object.keys(toolTipData);
	const { TooltipInPortal } = useTooltipInPortal();

	return (
		<TooltipInPortal key={Math.random()} top={top} left={left}>
			<Box>
				<Grid templateRows='repeat(5, 1fr)' gap={0}>
					{keys.map((key, index) => {
						if (key === 'id')
							return (
								<GridItem w='100%' h='5' color='#2B8A79' key={index}>
									<strong>{key}</strong>: {toolTipData[key] as number}
								</GridItem>
							);
						return (
							<GridItem w='100%' h='5' color='#2B8A79' key={index}>
								<strong>{key}</strong>:{' '}
								{(toolTipData[key] as API.Property[])[0].value.toFixed(3)}
								{(toolTipData[key] as API.Property[])[0].unit}
							</GridItem>
						);
					})}
				</Grid>
			</Box>
		</TooltipInPortal>
	);
};
export default CustomNode;
