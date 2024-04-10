import { Flex, Box } from '@chakra-ui/react';
import StatusCard from './components/StatusCard';
import { WACQTInfoCard } from './components/WACQTInfoCard';

const Hero = () => (
	<Flex gap='8' my='8' height='max-content'>
		<Box flex='1'>
			<WACQTInfoCard />
		</Box>
		<Box flex='1'>
			<StatusCard />
		</Box>
	</Flex>
);

export default Hero;
