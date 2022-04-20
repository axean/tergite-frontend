import { Group } from '@visx/group';
import { Text } from '@visx/text';
import { useTooltip, useTooltipInPortal, defaultStyles } from "@visx/tooltip";
import {Box, Grid, GridItem} from '@chakra-ui/react';
import React, { useContext } from 'react';
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
	qubits,
	resonators,
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

	const {
		tooltipOpen,
		tooltipTop,
		tooltipLeft,
		hideTooltip,
		showTooltip,
		tooltipData
	  } = useTooltip();

	const qubitProps = {
		x: qubits.x,
		y: qubits.y,
		freq: Math.round((qubits.static_properties[0].value / 1000000000) * 100) / 100,
		freqUnit: 'G' + qubits.static_properties[0].unit,
		anharm: "TEMP",
		anharmUnit: "TEMP",
		resFreq: Math.round((resonators.static_properties[0].value / 1000000000) * 100) / 100,
		resFreqUnit: 'G' + resonators.static_properties[0].unit,
		dli: qubits.xy_drive_line
	}

	  const { containerRef, TooltipInPortal } = useTooltipInPortal();

	  let tooltipTimeout;

	  console.log(qubits);
	  console.log(resonators);

	  const formattedValue = data.nodeData.data
		? Math.abs(data.nodeData.data[0].value) > 9999
			? data.nodeData.data[0].value.toFixed(0)
			: data.nodeData.data[0].value.toFixed(3)
		: id;

	const [{ selectedNode }, dispatch] = useContext(BackendContext);
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
				if (tooltipTimeout) clearTimeout(tooltipTimeout);
				const top = event.clientY;
				const left = event.clientX;

				showTooltip({
				  tooltipData: selectedNode,
				  tooltipTop: top,
				  tooltipLeft: left
				});
			  }}
		>
			<rect
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

			{tooltipOpen && tooltipData && (
        	<TooltipInPortal
         		 key={Math.random()}
         		 top={tooltipTop}
          		left={tooltipLeft}
        	>
          	<Box>
				<Grid templateRows='repeat(5, 1fr)' gap={0}>
					<GridItem w='100%' h='5' color="#2B8A79">
						<strong>Qubit ({qubitProps.x}, {qubitProps.y}) </strong>
					</GridItem>
					<GridItem w='100%' h='5'>
						Qubit Frequency: {qubitProps.freq} {qubitProps.freqUnit}
					</GridItem>
					<GridItem w='100%' h='5'>
						Anharmonicity: {qubitProps.anharm} {qubitProps.anharmUnit}
					</GridItem>
					<GridItem w='100%' h='5'>
						Resonator Frequency: {qubitProps.resFreq} {qubitProps.resFreqUnit}
					</GridItem>
					<GridItem w='100%' h='5'>
						Drive Line Index: {qubitProps.dli}
					</GridItem>
				</Grid>
		</Box>
        </TooltipInPortal>
		)}
		</Group>
	);
};

export default CustomNode;
