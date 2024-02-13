import { Box, HStack, Icon, VStack, Text } from '@chakra-ui/react';
import React from 'react';
import { TiArrowSortedUp } from 'react-icons/ti';

interface ColorSliderProps {
	values: number[];
	displayValue: number;
	unit: string;
}

function normalizeDisplayValue(min, max, displayValue) {
	let a = max - min;
	let b = max - displayValue;
	let c = b / a;
	return Math.min(c * 100 + 5, 103);
}

const ColorSlider = ({ values, displayValue, unit }: ColorSliderProps) => {
	return (
		<VStack w='30%' m='10px'>
			<Box
				h='10px'
				w='100%'
				bgGradient='linear(to-r, teal.200, teal.500)'
				borderRadius='10px'
			>
				{' '}
			</Box>
			<Box
				alignSelf='end'
				w={normalizeDisplayValue(values[0], values[1], displayValue) + '%'}
			>
				<VStack alignSelf='end' w='fit-content'>
					<Icon as={TiArrowSortedUp} />
					<Text fontSize='10'>
						{displayValue} {unit}
					</Text>
				</VStack>
			</Box>
		</VStack>
	);
};

export default ColorSlider;

/*
<Box h='50px' w='50%' m='10px'>
            <VStack>
                <HStack w='100%'>
                <Text w='5%' fontSize='10'>Min 4.0</Text>
                    <Box h='10px' w='90%'  bgGradient='linear(to-r, teal.200, teal.500)' borderRadius='10px'> </Box>
                <Text w='5%' fontSize='10'>Max 5.0</Text>
                </HStack>
                <VStack alignSelf='start' paddingLeft={normalizeDisplayValue(4.0,5.1,4.55)+'%'} spacing='1' w='50%' bgColor='tomato'>
                    <Icon  as={TiArrowSortedUp}/>
                    <Text fontSize='10'>Avg: 4.8GHz</Text>

                </VStack>
            </VStack>           
        </Box>

*/
