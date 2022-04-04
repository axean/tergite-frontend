import React, { useState } from 'react';
import { DateRange } from 'react-date-range';
import sv from 'react-date-range/dist/locale/'
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



	return (
		<DateRange
			editableDateInputs={true}
			onChange={(item) => setDate([item.selection])}
			moveRangeOnFirstSelection={false}
			ranges={date}
            locale={sv}
            weekStartsOn={1}
		/>
	);
};

export default DatePicker;