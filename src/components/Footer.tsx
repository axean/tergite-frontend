import Image from "next/image"

export default function Footer({}: Props) {
    return (
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
    )
}

interface Props {}