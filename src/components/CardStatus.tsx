import React from 'react';
import {
	Grid,
	GridItem,
	Text,
	Box,
	CircularProgress,
	CircularProgressLabel,
	Flex
} from '@chakra-ui/react';

interface CardStatusProps {
	percentage: number;
	noComputers: number;
}

const CardStatus = ({ percentage, noComputers }: CardStatusProps) => {
	return (
		<Flex
			justify='space-between'
			bg='white'
			rounded='xl'
			boxShadow='2xl'
			p='8'
			alignContent='center'
			h='full'
		>
			<Flex direction='column' justify='space-between'>
				<Text fontSize='2xl'>Systems online</Text>
				<Text fontWeight='bold' fontSize='xl'>
					{noComputers}
				</Text>
			</Flex>
			<Flex alignItems='center'>
				<CircularProgress
					value={percentage}
					color='#38B2AC'
					trackColor='#d9fff3'
					size='3em'
				>
					<CircularProgressLabel>
						<Text fontSize='lg' fontWeight='bold'>
							{percentage}%
						</Text>
					</CircularProgressLabel>
				</CircularProgress>
			</Flex>
		</Flex>
		// <Box bg='white' rounded='md' boxShadow='2xl'>
		// 	<Grid
		// 		w='full'
		// 		h='full'
		// 		templateRows='repeat(2, 3em)'
		// 		templateColumns='repeat(2, 9em)'
		// 		gap={1}
		// 		justifyContent='center'
		// 		pt='2'
		// 	>
		// 		<GridItem rowSpan={1} colSpan={1} bg=''>
		// 			Systems online
		// 		</GridItem>
		// 		<GridItem rowSpan={2} colSpan={1}>
		// 			<CircularProgress
		// 				value={percentage}
		// 				color='#38B2AC'
		// 				trackColor='#d9fff3'
		// 				size='90px'
		// 			>
		// 				<CircularProgressLabel>{percentage}%</CircularProgressLabel>
		// 			</CircularProgress>
		// 		</GridItem>
		// 		<GridItem rowSpan={1} colSpan={1} bg=''>
		// 			{noComputers}
		// 		</GridItem>
		// 	</Grid>
		// </Box>
	);
};

CardStatus.defaultProps = {
	percentage: 40,
	noComputers: 13
};

export default CardStatus;
