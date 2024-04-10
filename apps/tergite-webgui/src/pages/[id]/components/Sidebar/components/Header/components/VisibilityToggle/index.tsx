import { Button, Icon } from '@chakra-ui/react';
import React, { MouseEventHandler } from 'react';
import { MdFirstPage } from 'react-icons/md';

export const VisibilityToggleBtn = ({ onClick }: Props) => (
	<Button data-cy-collapse-button ml='5' p='1' onClick={onClick}>
		<Icon as={MdFirstPage} w={8} h={8} />
	</Button>
);

interface Props {
	onClick: MouseEventHandler<HTMLButtonElement>;
}

export default VisibilityToggleBtn;
