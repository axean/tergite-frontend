import React from 'react';
import { Grid, GridItem, Box, CircularProgress, CircularProgressLabel } from '@chakra-ui/react'

interface CardStatusProps {
	percentage: number;
    noComputers: number;
}

const CardStatus = ( {percentage, noComputers}: CardStatusProps) => {
	return (

        
        <Box 
            w='22em' 
            h='7em' 
            bg='white' 
            rounded='md' 
            boxShadow='2xl'
        >
            <Grid
                templateRows='repeat(2, 3em)'
                templateColumns='repeat(2, 9em)'
                gap={1}
                justifyContent='center'
                pt='2'
            >
                <GridItem rowSpan={1} colSpan={1} bg=''>
                    Systems online
                </GridItem>
                <GridItem rowSpan={2} colSpan={1} align='right'>
                    <CircularProgress value={percentage} color='#38B2AC' trackColor='#d9fff3' size='90px'>
                        <CircularProgressLabel>{percentage}%</CircularProgressLabel>
                    </CircularProgress>                
                </GridItem>
                <GridItem rowSpan={1} colSpan={1} bg=''>
                    {noComputers}
                </GridItem>
            </Grid>
        </Box>
	);
};

CardStatus.defaultProps = {
    percentage: 40,
    noComputers: 13
}

export default CardStatus;