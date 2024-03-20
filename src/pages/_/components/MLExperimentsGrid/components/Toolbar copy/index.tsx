import { Flex, Button, Heading } from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';

const Toolbar = ({ title, onRefreshBtnClick }: Props) => (
	<Flex justify='space-between' mb='4'>
		<Heading as='h3' fontSize='xl' mb='4'>
			{title}
		</Heading>
		<Button size='md' rounded='full' onClick={onRefreshBtnClick} data-cy-refresh-btn>
			<RepeatIcon />
		</Button>
	</Flex>
);

interface Props {
	title: string;
	onRefreshBtnClick: () => void;
}

export default Toolbar;
