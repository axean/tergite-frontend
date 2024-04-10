import { Flex, Text } from '@chakra-ui/react';
import React from 'react';
import DatePicker from 'react-datepicker';

import 'react-datepicker/dist/react-datepicker.css';

export const LabeledDatePicker = ({ label, selected, onChange }: Props) => (
	<Flex justifyContent='space-between' gap='2' alignItems='center'>
		<Text as='span' fontSize='1rem' fontWeight='semibold'>
			{label}
		</Text>
		<DatePicker
			selected={selected}
			onChange={onChange}
			timeInputLabel='Time:'
			dateFormat='yyyy-MM-dd HH:mm'
			showTimeInput
			showIcon
			isClearable
			wrapperClassName='date-picker'
		/>
	</Flex>
);

interface Props {
	label: string;
	selected: Date;
	onChange: (date: Date) => void;
}
