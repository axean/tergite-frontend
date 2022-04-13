import { AxisLeft, AxisBottom } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { Group } from '@visx/group';
import { scaleLinear } from '@visx/scale';

interface LineChartProps {
	data?: { x: { minX: number; maxX: number }; y: { minY: number; maxY: number } };
	width: number;
	height: number;
}

const LineChart: React.FC<LineChartProps> = ({ data, width, height }) => {
	const margin = { top: 40, right: 40, bottom: 50, left: 40 };

	const innerWidth = width - margin.left - margin.right;
	const innerHeight = height - margin.top - margin.bottom;
	const { minX, maxX } = data.x;
	const { minY, maxY } = data.y;
	// Defining scales

	// horizontal, x scale
	const xScale = scaleLinear({
		range: [0, innerWidth],
		domain: [minX, maxX],
		nice: true
	});

	// vertical, y scale
	const yScale = scaleLinear({
		range: [innerHeight, 0],
		domain: [minY, maxY],
		nice: true
	});

	return (
		<svg width={width} height={height}>
			<GridRows
				scale={yScale}
				width={innerWidth}
				height={innerHeight - margin.top}
				stroke='#EDF2F7'
				strokeOpacity={0.2}
			/>
			<GridColumns
				scale={xScale}
				width={innerWidth}
				height={innerHeight}
				stroke='#EDF2F7'
				strokeOpacity={0.2}
			/>
			<rect x={0} y={0} width={width} height={height} fill={'#718096'} rx={14} />
			<Group left={margin.left} top={margin.top}>
				<AxisLeft
					stroke={'#EDF2F7'}
					tickStroke={'#EDF2F7'}
					scale={yScale}
					tickLabelProps={() => ({
						fill: '#EDF2F7',
						fontSize: 14,
						textAnchor: 'end'
					})}
				/>
				<AxisBottom
					scale={xScale}
					stroke={'#EDF2F7'}
					tickStroke={'#EDF2F7'}
					top={innerHeight}
					tickLabelProps={() => ({
						fill: '#EDF2F7',
						fontSize: 14,
						textAnchor: 'middle'
					})}
				/>
				<rect x={0} y={0} width={innerWidth} height={innerHeight} fill={'#A0AEC0'} />
			</Group>
		</svg>
	);
};

export default LineChart;
