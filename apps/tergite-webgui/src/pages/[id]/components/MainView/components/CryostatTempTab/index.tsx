import { Grid, GridItem, Stack } from '@chakra-ui/react';
import React, { useState } from 'react';
import { ChannelTempGraph } from './components/ChannelTempGraph';
import TimeRange from './components/TimeRange';

export default function CryostatTempTab({ backend }: Props) {
	// default to a week back as start time
	const [startTimestamp, setStartTimestamp] = useState<Date>(
		new Date(Date.now() - 7 * 24 * 3_600_000)
	);
	const [endTimestamp, setEndTimestamp] = useState<Date>(new Date());
	const channels = [1, 2, 5, 6];

	return (
		<Stack>
			<TimeRange
				from={startTimestamp}
				onFromChange={setStartTimestamp}
				to={endTimestamp}
				onToChange={setEndTimestamp}
			/>
			<Grid
				h='96%'
				w='100%'
				py='2'
				gap={4}
				id='charts-grid'
				templateRows='repeat(2, 1fr)'
				templateColumns='repeat(2, 1fr)'
			>
				{channels.map((channel) => (
					<GridItem key={channel} bg='white' boxShadow='lg' p='2'>
						<ChannelTempGraph
							backend={backend}
							channel={channel}
							startTimestamp={startTimestamp}
							endTimestamp={endTimestamp}
						/>
					</GridItem>
				))}
			</Grid>
		</Stack>
	);
}

interface Props {
	backend: string | string[];
}
