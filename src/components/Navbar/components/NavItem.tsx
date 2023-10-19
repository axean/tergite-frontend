import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

export default function NavItem({ text, link }: Props) {
	const pathname = usePathname();
	const isActive = useMemo(() => pathname == link, [pathname]);
	return (
		<li className='flex items-center'>
			<NextLink
				href={link}
				passHref
				legacyBehavior
				aria-disabled={isActive}
				className='no-link-formatting flex items-center p-2 px-3 font-medium transition hover:underline focus:underline'
			>
				{text}
			</NextLink>
		</li>
	);
}

interface Props {
	text: string;
	link: string;
}

