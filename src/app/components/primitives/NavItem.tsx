import NextLink from "next/link";

export const NavItem = ({ text, link }: Props) => (
	<NextLink
		href={link}
		passHref
		legacyBehavior
		className='no-link-formatting flex items-center p-2 px-3 font-medium transition hover:underline focus:underline'
	>
		{text}
	</NextLink>
);

interface Props {
	text: string;
	link: string;
}
