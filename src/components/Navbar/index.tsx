'use client';
import React, { useEffect, useMemo, useCallback } from 'react';
import NavItem from './components/NavItem';
import Logo from './components/Logo';
import useSWR from 'swr';
import { fetcher, post } from '@/service/browser';
import { API } from '@/types';
import NavBtn from './components/NavBtn';
import { redirect } from 'next/navigation';
import { errors } from '@/constants';

const Navbar = ({}: Props) => {
	const { data: user, error, mutate } = useSWR('/api/me', fetcher<API.User>);
	const isAdmin = useMemo(() => user?.roles.includes(API.UserRole.ADMIN), [user]);

	const handleLogout = useCallback(
		async (ev: Event) => {
			ev.preventDefault();
			try {
				await post('/api/logout');
				await mutate(undefined, { revalidate: false });
				return redirect('/');
			} catch (error) {
				console.error(error);
			}
		},
		[mutate]
	);

	useEffect(() => {
		if (error && error.message !== errors.UNAUTHENTICATED) {
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
					{user && <NavBtn text='Logout' onClick={handleLogout} />}
					{!user && <NavItem text='Login' link='/login' />}
				</ul>
			</nav>
		</header>
	);
};

export default Navbar;

interface Props {}
