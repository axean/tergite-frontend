import ServiceLink from './components/ServiceLink';

export default function MainSection({ text, services }: Props) {
	return (
		<div id='main-content' className='py-10 px-5 lg:px-12'>
			<div className='mx-auto mb-5 lg:flex w-4/5 max-w-screen-xl'>
				<header className='mr-12 flex-1'>
					<section
						data-cy-main-content
						className='mb-10 text-lg font-light leading-8 text-neutral-800 child:mt-0'
					>
						<p>{text}</p>
					</section>
				</header>
				<nav
					className='mb-auto w-[325px] lg:block relative'
					aria-label='Secondary navigation'
				>
					{services.map((props) => (
						<ServiceLink key={props.href} {...props} />
					))}
				</nav>
			</div>
		</div>
	);
}

interface Props {
	text: string;
	services: Tergite.ServiceLinkInfo[];
}

