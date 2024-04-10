import React from 'react';
import { VictoryLabel, VictoryLabelProps } from 'victory';

export default function DatetimeLabel(props: VictoryLabelProps) {
	let { text, ...rest } = props;
	text = `${text}`;

	if (text.length > 5) {
		const [dateString, timeString] = text.split(', ');
		text = `${timeString.slice(undefined, 5)}\n${dateString}`;
	}

	return <VictoryLabel {...rest} text={text} />;
}
