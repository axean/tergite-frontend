import NextLink from 'next/link';

export default function HeaderBtn({ text, link }: Props) {
	return (
		<NextLink href={link} passHref legacyBehavior>
			<button
				data-cy-action-btn
				className='rounded bg-west-coast text-white py-2 px-7 hover:bg-west-coast font-semibold hover:text-white  border border-west-coast-300 hover:border-transparent'
			>
				{text}
			</button>
		</NextLink>
	);
}

interface Props {
	text: string;
	link: string;
}
