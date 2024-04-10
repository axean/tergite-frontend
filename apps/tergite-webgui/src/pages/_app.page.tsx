import '../globals.css';

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import theme from '../theme';
import DefaultLayout from '../components/layouts/DefaultLayout';
import BackendContextProvider from '@/state/BackendContext';

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: Next.AppPropsWithLayout) {
	const getLayout = Component.getLayout ?? ((page) => <DefaultLayout>{page}</DefaultLayout>);
	return (
		<QueryClientProvider client={queryClient}>
			<ChakraProvider resetCSS theme={theme}>
				<BackendContextProvider>
					{getLayout(<Component {...pageProps} />)}
				</BackendContextProvider>
			</ChakraProvider>
		</QueryClientProvider>
	);
}

export default MyApp;
