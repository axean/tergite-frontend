import { Button, Flex, Heading } from '@chakra-ui/react';
import React, { useMemo, useCallback } from 'react';
import ResetBtn from './components/ResetBtn';
import QubitSelector from './components/QubitSelector';
import { capitalizeFirstWord } from './utils';

export default function Toolbar({
	data,
	onReclassify,
	onReset,
	isRecalculating,
	currentQubit
}: TabBarProps) {
	const heading = useMemo(
		() =>
			data?.name
				? `Calibration details for ${capitalizeFirstWord(data.name)}`
				: 'Calibration details',
		[data?.name]
	);

	const qubits = useMemo(
		() => Object.keys(data?.classification || {}).sort(),
		[data?.classification]
	);

	const handleQubitSelection = useCallback((e) => e.preventDefault(), []);

	return (
		<Flex
			p='4'
			justifyContent='space-between'
			alignItems='center'
			data-cy-tabbar
			borderBottom='0.5px'
			borderBottomColor='gray'
		>
			<Heading as='h2' fontSize='xl' fontWeight='light' color='black'>
				{heading}
			</Heading>
			<Flex justifyContent='space-between'>
				<QubitSelector
					value={currentQubit}
					qubits={qubits}
					onChange={handleQubitSelection}
				/>
				<Button
					isLoading={isRecalculating}
					isDisabled={isRecalculating}
					size='sm'
					mx='2'
					fontWeight='light'
					onClick={onReclassify}
					colorScheme='teal'
				>
					State discrimination
				</Button>
				<ResetBtn onReset={onReset} />
			</Flex>
		</Flex>
	);
}

interface TabBarProps {
	data?: API.Response.Classification;
	currentQubit: string;
	onReclassify: (event: any) => void;
	onReset: (event: any) => void;
	isRecalculating: boolean;
}
