import '../globals.css';

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import theme from '../theme';
import DefaultLayout from '../components/layouts/DefaultLayout';

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: Next.AppPropsWithLayout) {
	const getLayout = Component.getLayout ?? ((page) => <DefaultLayout>{page}</DefaultLayout>);
	return (
		<QueryClientProvider client={queryClient}>
			<ChakraProvider resetCSS theme={theme}>
				{getLayout(<Component {...pageProps} />)}
			</ChakraProvider>
		</QueryClientProvider>
	);
}

export default MyApp;
