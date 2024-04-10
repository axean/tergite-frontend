import MiniFooter from '@/components/MiniFooter';
import Navbar from '@/components/Navbar';

export default function LoginLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className='h-full w-full min-h-screen flex flex-col'>
			<Navbar />
			<div className='flex flex-1 justify-center items-center'>{children}</div>
			<MiniFooter />
		</div>
	);
}
