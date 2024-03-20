import { Box } from '@chakra-ui/react';
import { ParentSize } from '@visx/responsive';
import React from 'react';

import VisxChart from './components/VisxChart/VisxChart';

export default function ConnectivityMap(props: Props) {
	return (
		<Box
			bg={props.backgroundColor ? props.backgroundColor : 'gray.200'}
			borderRadius='md'
			px='0'
			py='0'
			overflow='hidden'
		>
			<ParentSize>
				{({ width }) => <VisxChart {...props} height={width} width={width} />}
			</ParentSize>
		</Box>
	);
}

interface Props {
	type: 'node' | 'link';
	size: number;
	hideLabels?: boolean;
	smallTicks?: boolean;
	squareSize?: 'small' | 'medium' | 'large';
	onSelect?: (id: number) => void;
	backgroundColor?: string;
	borderRadius?: number;
	nodeColor?: string;
	linkColor?: string;
	linkWidth?: number;
}
