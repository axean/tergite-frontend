import { Skeleton, Text } from '@chakra-ui/react';
import { PropsWithChildren } from 'react';

/**
 * A Skeleton wrapper that shows a skeleton when loading and an error if an error
 * is passed to it
 *
 * @param props - the props passed to the container
 * @returns - a component that shows a skeleton loading animation when loading
 */
export default function DefaultSkeleton({ isLoading, error, children }: PropsWithChildren<Props>) {
	return (
		<>
			{isLoading && (
				<Skeleton isLoaded={!isLoading} id='skeleton'>
					{!!error ? <Text color='red.400'>{error}</Text> : children}
				</Skeleton>
			)}

			{!isLoading && !error && children}
		</>
	);
}

interface Props {
	isLoading: boolean;
	error: any;
}
