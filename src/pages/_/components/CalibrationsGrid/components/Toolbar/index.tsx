import { Heading } from '@chakra-ui/react';

const Toolbar = ({ title }: Props) => (
	<>
		<Heading as='h3' fontSize='xl' mt='6' mb='4'>
			{title}
		</Heading>
	</>
);

interface Props {
	title: string;
}

export default Toolbar;
