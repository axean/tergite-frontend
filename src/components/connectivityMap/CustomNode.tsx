import { Group } from '@visx/group';
import { Text } from '@visx/text';
import { useTooltip, useTooltipInPortal, defaultStyles } from '@visx/tooltip';
import { Box, Grid, GridItem } from '@chakra-ui/react';
import React, { useContext, useEffect, useRef } from 'react';
import { BackendContext, MapActions } from '../../state/BackendContext';
import ToolTip from './ToolTip';

type CustomNodeProps = {
	id: number;
	x: number;
	y: number;
	yMax: number;
	xMax: number;
	onSelect?: (id: number) => void;
	squareSize: 'small' | 'medium' | 'large';
	hideLabels: boolean;
	data:
		| Nullable<{
				allNodeData: API.ComponentData[];
				nodeData: {
					id: number;
					data?: API.Property[];
				};
		  }>
		| any;
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

	const formattedValue =
		!hideLabels && data.nodeData.data
			? Math.abs(data.nodeData.data[0].value) > 9999
				? data.nodeData.data[0].value.toFixed(0)
				: data.nodeData.data[0].value.toFixed(3)
			: id;

	const [{ selectedNode, nodeComponent }, dispatch] = useContext(BackendContext);

	const nodeRef = useRef(null);

	return (
		<Group
			data-cy-qubitmap-node-type={nodeComponent}
			data-cy-qubitmap-node-id={id}
			top={yMax / 10 - size / 2}
			left={xMax / 10 - size / 2}
			onMouseEnter={(e) => {
				nodeRef.current.setAttribute('fill', '#38B2AC');
				nodeRef.current.setAttribute('stroke', '#66FFF7');
			}}
			onMouseLeave={(e) => {
				if (selectedNode !== id) {
					nodeRef.current.setAttribute('fill', '#366361');
					nodeRef.current.setAttribute('stroke', '#366361');
				}

				hideTooltip();
			}}
			onMouseDown={() => {
				dispatch({ type: MapActions.SELECT_NODE, payload: id });
				onSelect && onSelect(id);
			}}
			style={{ cursor: 'pointer' }}
			onMouseMove={(event) => {
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

export default CustomNode;
