import { getConfigs, getMe, logoutOnClient } from '@/utils/api';
import router, { SingletonRouter } from 'next/router';
import { useCallback, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';

export default function useCurrentUser(): Output {
	const queryKey = 'api/me';
	const queryClient = useQueryClient();

	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const {
		data: user,
		error: authError,
		isLoading: isLoggingIn
	} = useQuery<API.User>(queryKey, getMe, { retry: false });
	authError && redirectToTergiteLogin(router).catch(console.error);

	const logout = useCallback(async () => {
		try {
			setIsLoggingOut(true);
			await logoutOnClient();
			queryClient.removeQueries(queryKey, { exact: true });
			setIsLoggingOut(false);
		} catch (error) {
			console.error(error);
		}
	}, [queryClient]);

	return { user, logout, isLoggingOut, isLoggingIn };
}

/**
 * Redirects to the login screen of the qal9000/tergite landing page
 */
async function redirectToTergiteLogin(router: SingletonRouter) {
	const config = await getConfigs();
	const currentUrl = window?.location?.href || config.webguiBaseUrl;
	router.push(`${config.landingPageUrl}/login?next=${currentUrl}`);
}

interface Output {
	user?: API.User;
	logout: () => Promise<void>;
	isLoggingIn: boolean;
	isLoggingOut: boolean;
}
