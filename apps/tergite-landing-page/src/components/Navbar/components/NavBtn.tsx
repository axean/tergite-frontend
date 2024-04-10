const className =
	'no-link-formatting h-full items-center p-2 px-3 font-medium transition hover:bg-west-coast hover:text-white cursor-pointer';

export default function NavBtn({ text, onClick }: Props) {
	return (
		<li className='flex items-center mx-2'>
			<button data-cy-nav-btn className={className} onClick={onClick}>
				{text}
			</button>
		</li>
	);
}

interface Props {
	text: string;
	onClick: (ev: any) => void;
}
