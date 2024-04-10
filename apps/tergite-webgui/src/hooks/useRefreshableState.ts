import { useState } from 'react';

/**
 * Returns a state that can be refreshed, basing on a given callback,
 * by calling the refresh property returned.
 *
 * It can also be reset to its initial value.
 *
 * @param initialData - the initial value of the state
 * @param func - the asynchronous function to refresh the state
 * @returns - an object cotnaining the data, the isREfreshing state, the error, the refresh function and function to reset the state
 */
export default function useRefreshableState<T>(initialData: T | undefined, func: () => Promise<T>) {
	const [data, setData] = useState<T | undefined>(initialData);
	const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
	const [error, setError] = useState<any>();

	const refresh = () => {
		setError(undefined);
		setIsRefreshing(true);
		func()
			.then((res) => setData(res))
			.catch((e) => setError(e))
			.finally(() => setIsRefreshing(false));
	};

	const reset = () => setData(initialData);

	return { data, isRefreshing, error, refresh, reset };
}
