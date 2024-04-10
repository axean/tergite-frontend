import React, { useMemo } from 'react';
import { Point, PointProps } from 'victory';

export default function ColoredPoint({ datum, x, y, style, ...rest }: PointProps) {
	const fill = useMemo(() => datum.result || 'black', [datum]);
	const strokeWidth = useMemo(() => datum.size || 0, [datum]);
	const opacity = useMemo(() => datum.opacity || 1, [datum]);
	return <Point x={x} y={y} style={{ ...style, fill, strokeWidth, opacity }} {...rest} />;
}
