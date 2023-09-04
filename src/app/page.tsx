import Image from 'next/image';

export default function Home() {
	return (
		<>
			<header className='sticky top-0 z-50 flex max-h-full w-full flex-col bg-white shadow-md print:hidden lg:relative'>
				<button
					id='skip-to-content'
					className='group transition focus:underline lg:hover:underline focus:bg-west-coast focus:text-white outline-none sr-only flex w-full items-center justify-center !p-3 text-md font-semibold text-west-coast underline decoration-2 focus-visible:not-sr-only'
				>
					<span>Go to content</span>
					<span className='ml-3 inline-flex h-5 w-5 shrink-0 align-middle transition'>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							viewBox='0 0 24 24'
							fill='currentColor'
							aria-hidden='true'
							className='h-full w-full'
						>
							<path
								fillRule='evenodd'
								d='M12.97 3.97a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06l6.22-6.22H3a.75.75 0 010-1.5h16.19l-6.22-6.22a.75.75 0 010-1.06z'
								clipRule='evenodd'
							></path>
						</svg>
					</span>
				</button>
				<nav
					aria-label='Top navigation'
					className='hidden h-[40px] w-full justify-center md:justify-end bg-west-coast lg:flex'
				>
					<ul className='flex w-2xl max-w-full justify-end text-white'>
						<li>
							<a
								className='no-link-formatting flex items-center p-2 px-3 font-medium transition hover:underline focus:underline'
								href='/en/login/'
							>
								<span>Login</span>
							</a>
						</li>
					</ul>
				</nav>
				<nav
					aria-label='Site actions'
					className='relative flex mx-auto w-4/5 max-w-screen-2xl justify-between bg-white'
					data-headlessui-state=''
				>
					<a
						aria-label='To frontpage'
						className='group transition focus:underline lg:hover:underline focus:bg-west-coast focus:text-white outline-none group flex p-4 pr-0 xs:pr-4'
						href='#'
					>
						<Image
							alt='Chalmers logo'
							loading='lazy'
							width='135'
							height='18'
							decoding='async'
							data-nimg='1'
							className='group-focus:invert'
							style={{ color: 'transparent' }}
							src='/img/chalmers.26fdad12.svg'
						/>
					</a>
					<ul className='flex'>
						<li lang='sv'>
							<a
								aria-label='Change language to Swedish '
								href='#'
								className='group transition focus:underline lg:hover:underline focus:bg-west-coast focus:text-white outline-none flex h-full flex-col items-center px-2 py-3 font-semibold lg:flex-row lg:space-x-2'
							>
								<span className='h-6 w-6 transition-none inline-flex h-5 w-5 shrink-0 align-middle transition'>
									<svg
										xmlns='http://www.w3.org/2000/svg'
										fill='none'
										viewBox='0 0 24 24'
										strokeWidth='1.5'
										stroke='currentColor'
										aria-hidden='true'
										className='h-full w-full'
									>
										<path
											strokeLinecap='round'
											strokeLinejoin='round'
											d='M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418'
										></path>
									</svg>
								</span>
								<span aria-hidden='true' className='hidden xs:inline-flex'>
									Svenska
								</span>
								<span
									aria-hidden='true'
									className='flex w-10 justify-center xs:hidden'
								>
									sv
								</span>
							</a>
						</li>
					</ul>
				</nav>
			</header>
			<main className='w-full'>
				<header className='relative z-[2] w-full print:hidden'>
					<img
						alt='Quatum computer.'
						fetchPriority='high'
						decoding='async'
						data-nimg='fill'
						className='z-[-1] object-cover'
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
							<span className='mb-1.5 md:text-2xl'>
								Wallenberg Center for Quantum Technology
							</span>
							<h1
								id='wacqt'
								className='text-4xl !leading-tight lg:text-4xl font-bold !text-neutral-50 text-neutral-900'
							>
								WACQT
							</h1>
							<p className='content text-md mt-3.5 mb-2'>
								WACQT is a national research programme, coordinated from Chalmers,
								that aims to take Swedish research and industry to the forefront of
								quantum technology. Our main project is to develop a high-end
								quantum computer that can solve problems far beyond the reach of the
								best conventional supercomputers.
							</p>
						</div>
					</div>
				</header>
				<div id='main-content' className='py-10 px-5 lg:px-12'>
					<div className='mx-auto mb-5 lg:flex w-4/5 max-w-screen-xl'>
						<header className='mr-12 flex-1'>
							<section className='mb-10 text-lg font-light leading-8 text-neutral-800 child:mt-0'>
								<p>
									The world is on the verge of a quantum technology revolution,
									with extremely powerful computers, intercept-proof
									communications and hyper-sensitive measuring instruments in
									sight. Wallenberg Centre for Quantum Technology is a 12 year SEK
									1 billion research effort that aims to take Sweden to the
									forefront of this very rapidly expanding area of technology.
									Through an extensive research programme, we aim at developing
									and securing Swedish expertise within the main areas of quantum
									technology: quantum computing and simulation, quantum
									communications and quantum sensing. Our main project is to
									develop a quantum computer that can solve problems far beyond
									the reach of the best conventional supercomputers.
								</p>
							</section>
						</header>
						<nav
							className='mb-auto w-[325px] lg:block relative'
							aria-label='Secondary navigation'
						>
							<a
								href='/webgui'
								className='block w-full border-b-4 border-blue-300 bg-west-coast px-4 py-3 text-left font-bold text-white outline-none focus:ring-2 focus:ring-inset focus:ring-white focus:ring-offset-2 focus:ring-offset-west-coast'
							>
								GUI
							</a>

							<a
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
							<img
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

