import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@chakra-ui/react';

export default function ErrorAlert({ error }: Props) {
	return (
		<Alert status='error'>
			<AlertIcon />
			<AlertTitle>Error</AlertTitle>
			<AlertDescription>{error.message}.</AlertDescription>
		</Alert>
	);
}

interface Props {
	error: Error;
}
