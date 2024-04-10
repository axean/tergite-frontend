import { Flex } from '@chakra-ui/react';
import React from 'react';
import { LabeledDatePicker } from './components/LabeledDatePicker';

export default function TimeRange({ from, onFromChange, to, onToChange }: Props) {
	return (
		<Flex justifyContent='end' gap='2'>
			<LabeledDatePicker label='From' selected={from} onChange={onFromChange} />
			<LabeledDatePicker label='To' selected={to} onChange={onToChange} />
		</Flex>
	);
}
interface Props {
	from: Date;
	onFromChange: (date: any) => void;
	to: Date;
	onToChange: (date: any) => void;
}
