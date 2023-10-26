import MiniFooter from '@/components/MiniFooter';
import Navbar from '@/components/Navbar';
import SWRProvider from '@/components/SWRProvider';

// Fallbacks for swr querying especially on the server
const swrFallback = {
	'/api/me': undefined
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
	return (
		<SWRProvider fallback={swrFallback}>
			<div className='h-full w-full min-h-screen flex flex-col'>
				<Navbar />
				<div className='flex flex-1 w-4/5 mx-auto max-w-screen-2xl my-4 py-5 sm:my-10 sm:py-7 lg:py-10'>
					{children}
				</div>
				<MiniFooter />
			</div>
		</SWRProvider>
	);
}
