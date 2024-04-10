import Spinner from '@/components/Spinner';

export default function Loading() {
	return (
		<div className='w-screen h-screen flex justify-center items-center'>
			<Spinner className='w-12 h-12' />
		</div>
	);
}
