import { AxisLeft, AxisBottom } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { Group } from '@visx/group';
import { scaleLinear } from '@visx/scale';
import { LinePath } from '@visx/shape';
import { extent } from 'd3-array';

interface LineChartProps {
	data: { x: number; y: number }[];
	width: number;
	height: number;
}

const LineChart: React.FC<LineChartProps> = ({ data, width, height }) => {
	const margin = { top: 40, right: 40, bottom: 50, left: 40 };

	const innerWidth = width - margin.left - margin.right;
	const innerHeight = height - margin.top - margin.bottom;

	const getX = (d: { x: number; y: number }) => d.x;
	const getY = (d: { x: number; y: number }) => d.y;
	// Defining scales

	// horizontal, x scale
	const xScale = scaleLinear<number>({
		range: [0, innerWidth],
		domain: extent(data, getX) as [number, number],
		nice: true
	});

	// vertical, y scale
	const yScale = scaleLinear<number>({
		range: [innerHeight, 0],
		domain: extent(data, getY) as [number, number],
		nice: true
	});

	const series = [data, data];

	return (
		<svg width={width} height={height}>
			<rect x={0} y={0} width={width} height={height} fill={'#718096'} rx={14} />
			<Group left={margin.left} top={margin.top}>
				<GridRows
					scale={xScale}
					width={innerWidth}
					height={innerHeight}
					stroke='#FFFFFF'
					strokeOpacity={0.2}
				/>
				<GridColumns
					scale={yScale}
					width={innerWidth}
					height={innerHeight}
					stroke='#FFFFFF'
					strokeOpacity={0.2}
				/>
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
						fontSize: 11,
						textAnchor: 'middle'
					})}
				/>
				{series.map((sData, i) => (
					<LinePath
						key={i}
						stroke={'#30AB95'}
						strokeWidth={3}
						data={sData}
						x={(d) => xScale(getX(d)) ?? 0}
						y={(d) => yScale(getY(d)) ?? 0}
					/>
				))}
			</Group>
		</svg>
	);
};

export default LineChart;
