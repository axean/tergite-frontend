import { Flex, Button, Heading } from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';

const Toolbar = ({ title, onRefreshBtnClick }: Props) => (
	<Flex justify='space-between' my='4'>
		<Heading as='h3' fontSize='xl' my='2'>
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
