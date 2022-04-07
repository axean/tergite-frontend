import { Box, Tab, TabList, Tabs } from '@chakra-ui/react';
import React from 'react';

/*
To get current tab in parent element pass a setState function as a prop
Example: 
	const [tab, setTab] = useState('1')

	<RadioButtons setTab={setTab} tabs={['1', '2', '3']} />
*/
interface RadioButtonsProps {
	tabs: string[];
	setTab: (value: string) => void;
}

const RadioButtons = ({ setTab, tabs }: RadioButtonsProps) => {
	return (
		<Box borderRadius='full' border='2px' borderColor='grey' p='2' m='2px' w='fit-content'>
			<Tabs variant='soft-rounded' onChange={(index) => setTab(tabs[index])}>
				<TabList>
					{tabs.map((item) => (
						<Tab _selected={{ color: 'white', bg: '#38B2AC', boxShadow: 'none' }}>
							{item}
						</Tab>
					))}
				</TabList>
			</Tabs>
		</Box>
	);
};

export default RadioButtons;
