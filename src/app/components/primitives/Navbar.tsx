import React, { useMemo } from 'react';
import NextLink from 'next/link';
import Image from 'next/image';
import { NavItem } from './NavItem';


const Navbar = ({ user }: { user: API.User | null }) => {
	const [authLink, authText] = useMemo(
		() => (user ? ['/logout', 'Logout'] : ['/login', 'Logout']),
		[user]
	);
	const isAdmin = useMemo(() => user?.roles.includes(API.UserRole.ADMIN), [user]);

	return (
		<header className='sticky top-0 z-50 flex max-h-full w-full flex-col bg-white shadow-md print:hidden lg:relative'>
			<nav
				aria-label='Top navigation'
				className='h-[40px] w-full justify-center md:justify-end bg-west-coast lg:flex'
			>
			</nav>
			<nav
				aria-label='Site actions'
				className='relative flex mx-auto w-4/5 max-w-screen-2xl justify-between bg-white'
				data-headlessui-state=''
				data-cy-site-actions-navbar
			>
				<NextLink
					aria-label='To frontpage'
					className='group transition focus:underline lg:hover:underline focus:bg-west-coast focus:text-white outline-none group flex p-4 pr-0 xs:pr-4'
					href='/'
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
				</NextLink>
				<ul className='flex'>
					<li>{isAdmin && <NavItem text='Projects' link='/projects' />}</li>
					<li>{user && <NavItem text='App tokens' link='/app-tokens' />}</li>
					<li>
						<NavItem text={authText} link={authLink} />
					</li>
				</ul>
			</nav>
		</header>
	);
};

export default Navbar;
