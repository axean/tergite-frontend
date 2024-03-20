import { Button } from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import React, { MouseEventHandler } from 'react';

export default function ResetBtn({ onReset }: Props) {
	return (
		<Button size='sm' rounded='full' onClick={onReset}>
			<RepeatIcon />
		</Button>
	);
}
interface Props {
	onReset: MouseEventHandler<HTMLButtonElement>;
}
