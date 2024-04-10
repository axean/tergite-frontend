import React, { useMemo } from 'react';
import { Point, PointProps } from 'victory';

const ColoredPoint = ({ datum, x, y, style, ...rest }: PointProps) => {
	const fill = useMemo(() => (datum.state === 1 ? 'blue' : 'red'), [datum.state]);

	return <Point x={x} y={y} style={{ ...style, fill }} {...rest} />;
};

export default ColoredPoint;
