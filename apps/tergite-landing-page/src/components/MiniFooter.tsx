import Image from 'next/image';
import chalmersEmblem from '@/images/chalmers-emblem.svg';

export default function MiniFooter({}: Props) {
	return (
		<footer
			data-cy-footer
			role='contentinfo'
			className='mt-auto flex max-w-full flex-col bg-west-coast px-5 py-2 text-white print:hidden'
		>
			<nav
				aria-label='Footer navigation'
				className='flex mx-auto w-4/5 max-w-screen-2xl flex-col lg:flex-row'
			>
				<div className='flex w-full flex-col child:flex-1 child:flex-col lg:flex-row lg:justify-between lg:gap-8'>
					<div className=''></div>
				</div>
			</nav>
			<div className='flex mx-auto w-4/5 max-w-screen-2xl  gap-14'>
				<div className='flex flex-col  xs:flex-row xs:text-left'>
					<a
						className='no-link-formatting flex h-full select-none rounded-lg focus:bg-white/10'
						href='#'
					>
						<Image
							alt='Chalmers logo'
							loading='lazy'
							width='50'
							height='45'
							decoding='async'
							data-nimg='1'
							style={{ color: 'transparent' }}
							src={chalmersEmblem}
						/>
					</a>
				</div>
			</div>
		</footer>
	);
}

interface Props {}
