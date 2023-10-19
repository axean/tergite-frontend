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
				<div className='flex flex-1 justify-center items-center'>{children}</div>
				<MiniFooter />
			</div>
		</SWRProvider>
	);
}

