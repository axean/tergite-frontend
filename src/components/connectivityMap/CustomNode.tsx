import { Group } from '@visx/group';
import { Text } from '@visx/text';
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
};

const CustomNode: React.FC<CustomNodeProps> = ({
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

	const [{ selectedNode }, dispatch] = useContext(BackendContext);
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
	console.log(size);
	return (
		// yMax/10 is the size of half a square
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
			}}
			onMouseDown={() => {
				dispatch({ type: MapActions.SELECT_NODE, payload: id });
				onSelect && onSelect(id);
			}}
			style={{ cursor: 'pointer' }}
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
					{id}
				</Text>
			)}
		</Group>
	);
};

export default CustomNode;
