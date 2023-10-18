import Image from 'next/image';
import Navbar from '../components/primitives/Navbar';
import { getCurrentUser } from '../service';

export default async function Home() {
	const heroText =
		'WACQT is a national research programme, coordinated from Chalmers, that aims to take Swedish research and industry to the forefront of quantum technology. Our main project is to develop a high-end quantum computer that can solve problems far beyond the reach of the best conventional supercomputers.';

	const mainContentText =
		'The world is on the verge of a quantum technology revolution, with extremely powerful computers, intercept-proof communications and hyper-sensitive measuring instruments in sight. Wallenberg Centre for Quantum Technology is a 12 year SEK 1 billion research effort that aims to take Sweden to the forefront of this very rapidly expanding area of technology. Through an extensive research programme, we aim at developing and securing Swedish expertise within the main areas of quantum technology: quantum computing and simulation, quantum communications and quantum sensing. Our main project is to develop a quantum computer that can solve problems far beyond the reach of the best conventional supercomputers.';

	const user = await getCurrentUser();
	return (
		<>
			<Navbar user={user} />
			<main className='w-full'>
				<header className='relative z-[2] w-full print:hidden' data-cy-hero>
					<Image
						alt='Quatum computer.'
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
						src='/img/hero.webp'
					/>
					<div className='z-10 mx-auto flex h-[478px] w-4/5 max-w-screen-xl items-end sm:h-auto'>
						<div className='m-4 flex max-w-4xl flex-col items-start bg-black/75 p-5 text-neutral-50 sm:my-28 sm:p-6 sm:py-7 lg:py-10 2xl:mx-0'>
							<span data-cy-hero-title className='mb-1.5 md:text-2xl'>
								Wallenberg Center for Quantum Technology
							</span>
							<h1
								id='wacqt'
								data-cy-hero-subtitle
								className='text-4xl !leading-tight lg:text-4xl font-bold !text-neutral-50 text-neutral-900'
							>
								WACQT
							</h1>
							<p data-cy-hero-text className='content text-md mt-3.5 mb-2'>
								{heroText}
							</p>
						</div>
					</div>
				</header>
				<div id='main-content' className='py-10 px-5 lg:px-12'>
					<div className='mx-auto mb-5 lg:flex w-4/5 max-w-screen-xl'>
						<header className='mr-12 flex-1'>
							<section
								data-cy-main-content
								className='mb-10 text-lg font-light leading-8 text-neutral-800 child:mt-0'
							>
								<p>{mainContentText}</p>
							</section>
						</header>
						<nav
							className='mb-auto w-[325px] lg:block relative'
							aria-label='Secondary navigation'
						>
							<a
								data-cy-app-button
								href='/webgui'
								className='block w-full border-b-4 border-blue-300 bg-west-coast px-4 py-3 text-left font-bold text-white outline-none focus:ring-2 focus:ring-inset focus:ring-white focus:ring-offset-2 focus:ring-offset-west-coast'
							>
								GUI
							</a>

							<a
								data-cy-app-button
								href='/mss'
								className='block w-full border-b-4 border-blue-300 bg-west-coast px-4 py-3 text-left font-bold text-white outline-none focus:ring-2 focus:ring-inset focus:ring-white focus:ring-offset-2 focus:ring-offset-west-coast'
							>
								API
							</a>
						</nav>
					</div>
				</div>
			</main>
			<footer
				data-cy-footer
				role='contentinfo'
				className='mt-auto flex max-w-full flex-col  gap-8 bg-west-coast px-5 py-6 pb-20 text-white print:hidden lg:gap-10 lg:px-12 lg:py-20'
			>
				<nav
					aria-label='Footer navigation'
					className='flex mx-auto w-4/5 max-w-screen-2xl flex-col lg:flex-row'
				>
					<div className='flex w-full flex-col child:flex-1 child:flex-col lg:flex-row lg:justify-between lg:gap-8'>
						<div className=''>
							<h2 className='mb-4 text-2xl font-semibold'>Contact Chalmers</h2>
							<div>
								<p>
									<strong>Phone </strong>
									<br />
									+46-317721000
								</p>
								<p>
									<strong>E-mail</strong>
									<br />
									<a href='mailto:info@chalmers.se'>info@chalmers.se</a>
								</p>
								<p>
									<strong>Mail address</strong>
									<br />
									Chalmers University of Technology
									<br />
									412 96 Gothenburg
								</p>
								<p>
									<strong>Visiting address</strong>
									<br />
									Chalmersplatsen 4, Gothenburg
								</p>
							</div>
						</div>

						<ul className='flex flex-col lg:gap-5'>
							<li>
								<h2 className='mb-4 mt-5 lg:mt-0 text-2xl font-semibold lg:inline-flex'>
									About the website
								</h2>
								<ul
									className='block lg:flex flex-col overflow-visible transition'
									id='headlessui-disclosure-panel-:R1s5im:'
									data-headlessui-state=''
								>
									<li className='flex w-full'>
										<a
											className='inline-flex flex-1 items-center justify-between py-[2px] transition hover:no-underline focus:underline lg:justify-start lg:hover:underline'
											href='/en/about-chalmers/about-the-website/processing-of-personal-data/'
										>
											<span className='text-lg lg:text-base'>
												Processing of personal data
											</span>
										</a>
									</li>
									<li className='flex w-full'>
										<a
											className='inline-flex flex-1 items-center justify-between py-[2px] transition hover:no-underline focus:underline lg:justify-start lg:hover:underline'
											href='/en/about-chalmers/about-the-website/cookies/'
										>
											<span className='text-lg lg:text-base'>Cookies</span>
										</a>
									</li>
									<li className='flex w-full'>
										<a
											className='inline-flex flex-1 items-center justify-between py-[2px] transition hover:no-underline focus:underline lg:justify-start lg:hover:underline'
											href='/en/about-chalmers/about-the-website/accessibility-report/'
										>
											<span className='text-lg lg:text-base'>
												Accessibility statement
											</span>
										</a>
									</li>
								</ul>
							</li>
						</ul>
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
								width='133'
								height='121'
								decoding='async'
								data-nimg='1'
								style={{ color: 'transparent' }}
								src='/img/logo.81582248.svg'
							/>
						</a>
					</div>
				</div>
			</footer>
		</>
	);
}

