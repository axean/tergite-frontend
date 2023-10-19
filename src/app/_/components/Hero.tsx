import Image from 'next/image';
export default function Hero({ text, title, subtitle, imgSrc, imgAlt }: Props) {
	return (
		<header className='relative z-[2] w-full print:hidden' data-cy-hero>
			<Image
				alt={imgAlt}
				fetchPriority='high'
				decoding='async'
				data-nimg='fill'
				className='z-[-1] object-cover'
				layout='fill'
				style={{
					position: 'absolute',
					height: '100%',
					width: '100%',
					inset: '0px',
					objectPosition: '50% 50%',
					color: 'transparent'
				}}
				src={imgSrc}
			/>
			<div className='z-10 mx-auto flex h-[478px] w-4/5 max-w-screen-xl items-end sm:h-auto'>
				<div className='m-4 flex max-w-4xl flex-col items-start bg-black/75 p-5 text-neutral-50 sm:my-28 sm:p-6 sm:py-7 lg:py-10 2xl:mx-0'>
					<span data-cy-hero-title className='mb-1.5 md:text-2xl'>
						{title}
					</span>
					<h1
						id='wacqt'
						data-cy-hero-subtitle
						className='text-4xl !leading-tight lg:text-4xl font-bold !text-neutral-50 text-neutral-900'
					>
						{subtitle}
					</h1>
					<p data-cy-hero-text className='content text-md mt-3.5 mb-2'>
						{text}
					</p>
				</div>
			</div>
		</header>
	);
}

interface Props {
	title: string;
	subtitle: string;
	text: string;
	imgSrc: string;
	imgAlt: string;
}

