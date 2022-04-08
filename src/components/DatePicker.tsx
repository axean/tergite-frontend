import {
	Popover,
	PopoverTrigger,
	Button,
	PopoverContent,
	PopoverArrow,
	PopoverCloseButton,
	PopoverHeader,
	PopoverBody,
	Box
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { DateRange } from 'react-date-range';
import sv from 'react-date-range/dist/locale/';
import 'react-date-range/dist/styles.css'; // main css file
import 'react-date-range/dist/theme/default.css'; // theme css file

/*
Works the same as radio buttons.
To get current dates in parent element pass 
a setState function as a prop 
Example:
	const [date, setDate] = useState({
        startDate: new Date(),
        endDate: new Date()
    })

	<DatePicker setDates={setDate}/>
*/

interface DatePickerProps {
	setDates: (dates: any) => void;
}

const DatePicker = ({ setDates }: DatePickerProps) => {
	const [date, setDate] = useState([
		{
			startDate: new Date(),
			endDate: new Date(),
			key: 'selection',
			color: '#38B2AC'
		}
	]);

	const parseDates = () => {
		return (
			date[0].startDate.toDateString().slice(4, 10) +
			' - ' +
			date[0].endDate.toDateString().slice(4, 10)
		);
	};

	const handleChange = (item) => {
		setDate([item.selection]);
		setDates({
			startDate: item.selection.startDate,
			endDate: item.selection.endDate
		});
	};

	return (
		<Popover>
			<PopoverTrigger>
				<Button boxShadow='4px 4px 2px 1px rgba(0, 0, 0, .1)' _focus={{ outline: 'none' }}>
					Period: {parseDates()}
				</Button>
			</PopoverTrigger>
			<PopoverContent _focus={{ outline: 'none' }}>
				<PopoverArrow />
				<Box>
					<DateRange
						editableDateInputs={true}
						onChange={(item) => handleChange(item)}
						moveRangeOnFirstSelection={false}
						ranges={date}
						locale={sv}
						maxDate={new Date()}
						weekStartsOn={1}
					/>
				</Box>
			</PopoverContent>
		</Popover>
	);
};

export default DatePicker;
