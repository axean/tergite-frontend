import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

const defaultClassName =
	'no-link-formatting flex h-full items-center p-2 px-3 font-medium transition hover:bg-west-coast hover:text-white cursor-pointer';

export default function NavItem({ text, link }: Props) {
	const pathname = usePathname();
	const isActive = useMemo(() => pathname == link, [pathname]);
	const className = useMemo(
		() => `${defaultClassName} ${isActive ? 'text-white bg-west-coast' : ''}`,
		[isActive]
	);
	return (
		<li className='flex items-center mx-2'>
			<NextLink
				href={link}
				passHref
				legacyBehavior
				aria-disabled={isActive}
				aria-active={isActive}
			>
				<div className={className}>{text}</div>
			</NextLink>
		</li>
	);
}

interface Props {
	text: string;
	link: string;
}

