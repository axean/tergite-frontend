import { Button, Icon } from '@chakra-ui/react';
import React, { MouseEventHandler } from 'react';
import { MdLastPage } from 'react-icons/md';

export default function FullScreenToggleBtn({ onClick }: Props) {
	return (
		<Button data-cy-expand-button p='2' onClick={onClick}>
			<Icon as={MdLastPage} w={8} h={8} />
		</Button>
	);
}

interface Props {
	onClick: MouseEventHandler<HTMLButtonElement>;
}
