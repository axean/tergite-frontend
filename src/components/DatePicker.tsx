import { Popover, PopoverTrigger, Button, PopoverContent, PopoverArrow, PopoverCloseButton, PopoverHeader, PopoverBody } from '@chakra-ui/react';
import React, { useState } from 'react';
import { DateRange } from 'react-date-range';
import sv from 'react-date-range/dist/locale/';
import 'react-date-range/dist/styles.css'; // main css file
import 'react-date-range/dist/theme/default.css'; // theme css file

const DatePicker = () => {
	const [date, setDate] = useState([
		{
			startDate: new Date(),
			endDate: new Date(),
			key: 'selection',
			color: '#38B2AC'
		}
	]);

	const getDates = () =>{
		return date[0].startDate.toDateString().slice(4,10) + ' - ' + date[0].endDate.toDateString().slice(4,10)
	}

	console.log(getDates())

	return (
		<Popover>
  			<PopoverTrigger>
   			 <Button boxShadow='4px 4px 2px 1px rgba(0, 0, 0, .1)' _focus={{outline: 'none'}}>Period: {getDates()}</Button>
  			</PopoverTrigger>
 		 <PopoverContent _focus={{outline: 'none'}}>
			<PopoverArrow />
				<DateRange
					editableDateInputs={true}
					onChange={(item) => setDate([item.selection])}
					moveRangeOnFirstSelection={false}
					ranges={date}
					locale={sv}
					weekStartsOn={1}
				/>
			</PopoverContent>
		</Popover>

		
	);
};

export default DatePicker;
