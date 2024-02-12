import '../globals.css';

import { ChakraProvider } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import theme from '../theme';
import { AppProps } from 'next/app';
import Layout from '../components/Layout';
import BackendContextProvider from '../state/BackendContext';

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
	return (
		<QueryClientProvider client={queryClient}>
			<ChakraProvider resetCSS theme={theme}>
				<BackendContextProvider>
					<Layout>
						{/* @ts-expect-error */}
						<Component {...pageProps} />
					</Layout>
				</BackendContextProvider>
			</ChakraProvider>
		</QueryClientProvider>
	);
}

export default MyApp;
