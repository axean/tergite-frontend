import NextLink from 'next/link';

export default function ActionBtn({ text, link }: Props) {
	return (
		<NextLink href={link} passHref legacyBehavior>
			<button data-cy-action-btn className='text-west-coast py-2 pr-7 hover:underline'>
				{text}
			</button>
		</NextLink>
	);
}

interface Props {
	text: string;
	link: string;
}

