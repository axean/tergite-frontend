'use client';
import React, { useCallback, useEffect, useMemo } from 'react';
import NavItem from './components/NavItem';
import Logo from './components/Logo';
import useSWR from 'swr';
import { fetcher } from '@/service/browser';
import Loading from '../Loading';
import { useRouter } from 'next/router';

const Navbar = ({}: Props) => {
	const { data: user, error, isLoading } = useSWR('/api/me', fetcher<API.User>);
	const isAdmin = useMemo(() => user?.roles.includes(API.UserRole.ADMIN), [user]);

	useEffect(() => {
		if (error) {
			console.error(error);
		}
	}, [error]);

	return (
		<header className='sticky top-0 z-50 flex max-h-full w-full flex-col bg-white shadow-md print:hidden lg:relative'>
			<nav
				aria-label='Top navigation'
				className='h-[40px] w-full justify-center md:justify-end bg-west-coast lg:flex'
			></nav>
			<nav
				aria-label='Site actions'
				className='relative flex mx-auto w-4/5 max-w-screen-2xl justify-between bg-white'
				data-headlessui-state=''
				data-cy-site-actions-navbar
			>
				<Logo src='/img/chalmers.26fdad12.svg' />
				<ul className='flex'>
					{<NavItem text='Home' link='/' />}
					{isAdmin && <NavItem text='Projects' link='/projects' />}
					{user && <NavItem text='App tokens' link='/app-tokens' />}
					{user && <NavItem text='Logout' link='/logout' />}
					{!user && <NavItem text='Login' link='/login' />}
				</ul>
			</nav>
		</header>
	);
};

export default Navbar;

interface Props {}
