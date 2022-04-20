import { AxisLeft, AxisBottom } from '@visx/axis';
import { GridRows, GridColumns } from '@visx/grid';
import { Group } from '@visx/group';
import { scaleLinear } from '@visx/scale';
import { LinePath } from '@visx/shape';
import { extent } from 'd3-array';
import { LineData } from '../visualizations/LineChartVisualization';

interface LineChartProps {
	data: LineData[];
	width: number;
	height: number;
}

const LineChart: React.FC<LineChartProps> = ({ data, width, height }) => {
	const margin = { top: 40, right: 40, bottom: 50, left: 80 };

	const innerWidth = width - margin.left - margin.right;
	const innerHeight = height - margin.top - margin.bottom;

	if (!data) {
		return <span>NO DATA</span>;
	}
	const getX = (d: LineData) => d.x;
	const getY = (d: LineData) => d.y;

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
			<Group left={margin.left} top={margin.top}>
				<AxisLeft
					stroke={'#000000'}
					tickStroke={'#000000'}
					scale={yScale}
					tickLabelProps={() => ({
						fill: '#000000',
						fontSize: 11,
						textAnchor: 'end'
					})}
				/>
				<AxisBottom
					scale={xScale}
					stroke={'#000000'}
					tickStroke={'#000000'}
					top={innerHeight}
					tickLabelProps={() => ({
						fill: '#000000',
						fontSize: 11,
						textAnchor: 'middle'
					})}
				/>
				<GridRows
					scale={yScale}
					width={innerWidth}
					height={innerHeight}
					stroke='#000000'
					strokeOpacity={0.2}
				/>
				<GridColumns
					scale={xScale}
					width={innerWidth}
					height={innerHeight}
					stroke='#000000'
					strokeOpacity={0.2}
				/>
				{series.map((sData, i) => {
					return (
						<Group key={'lines' + i}>
							{sData.map((d, j) => (
								<circle
									key={i + j}
									r={5}
									cx={xScale(getX(d))}
									cy={yScale(getY(d))}
									stroke='#30AB95'
									fill='#30AB95'
								/>
							))}

							<LinePath
								key={i}
								stroke={'#30AB95'}
								strokeWidth={3}
								data={sData}
								x={(d) => xScale(getX(d)) ?? 0}
								y={(d) => yScale(getY(d)) ?? 0}
							/>
						</Group>
					);
				})}
			</Group>
		</svg>
	);
};

export default LineChart;
