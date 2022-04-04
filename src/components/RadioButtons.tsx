import { Box, Divider, Tab, TabList, Tabs } from '@chakra-ui/react';
import React, { useState } from 'react';

const RadioButtons = (props) => {
	const [currentTab, setTab] = useState(0);
	const tab = props.tabs[currentTab];

    console.log(tab)
	return (
		<Box borderRadius='full' border='1px' borderColor='grey' p='1' m='2px' w='fit-content'>
			<Tabs variant='soft-rounded' onChange={(index) => setTab(index)}>
				<TabList>
                {props.tabs.map(item => <Tab _selected={{ color: 'white', bg: '#38B2AC',boxShadow:'none'}}>{item}</Tab>)}
				</TabList>
			</Tabs>
		</Box>
	);
};

export default RadioButtons;

