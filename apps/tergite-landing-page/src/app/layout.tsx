import SWRProvider from '@/components/SWRProvider';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'QAL9000',
	description: 'Quatum Computer Stack for WACQT'
};

// Fallbacks for swr querying especially on the server
const swrFallback = {
	'/api/me': undefined
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang='en'>
			<body className={inter.className}>
				<SWRProvider fallback={swrFallback}>{children}</SWRProvider>
			</body>
		</html>
	);
}
