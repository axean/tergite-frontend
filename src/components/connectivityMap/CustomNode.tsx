import { Group } from '@visx/group';
import { Text } from '@visx/text';
import React from 'react';

type CustomNodeProps = {
	yMax: number;
	xMax: number;
	x: number;
	y: number;
	setSelectedNode: React.Dispatch<number>;
	selectedNode: number;
	id: number;
	onSelect: (id: number) => void;
};

const CustomNode: React.FC<CustomNodeProps> = ({
	yMax,
	xMax,
	x,
	y,
	id,
	setSelectedNode,
	selectedNode,
	onSelect
}) => {
	return (
		// yMax / 20 centers the qubit in the middle of the square, if removed its placed in the top left corner
		<Group
			top={yMax / 20}
			left={xMax / 20}
			onMouseEnter={(e) => {
				e.currentTarget.firstElementChild.setAttribute('fill', '#38B2AC');
				e.currentTarget.firstElementChild.setAttribute('stroke', '#66FFF7');
			}}
			onMouseLeave={(e) => {
				if (selectedNode !== id) {
					e.currentTarget.firstElementChild.setAttribute('fill', '#366361');
					e.currentTarget.firstElementChild.setAttribute('stroke', '#366361');
				}
			}}
			onMouseDown={() => {
				setSelectedNode(id);
				onSelect(id);
			}}
			style={{ cursor: 'pointer' }}
		>
			<rect
				x={x}
				y={y}
				width={xMax / 10}
				height={yMax / 10}
				fill={selectedNode === id ? '#38B2AC' : '#366361'}
				stroke={selectedNode === id ? '#66FFF7' : '#366361'}
				strokeWidth={2}
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
				{id}
			</Text>
		</Group>
	);
};

export default CustomNode;
