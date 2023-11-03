import NextLink from 'next/link';

export function HeaderLinkBtn({
	text,
	link,
	className = 'bg-west-coast hover:bg-west-coast text-white border-west-coast-300 hover:text-white'
}: Props) {
	return (
		<NextLink href={link} passHref legacyBehavior>
			<button
				data-cy-header-btn
				className={`rounded py-2 px-7 font-semibold border hover:border-transparent ${className}`}
			>
				{text}
			</button>
		</NextLink>
	);
}

interface Props {
	text: string;
	link: string;
	className?: string;
}
