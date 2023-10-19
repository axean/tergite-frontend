export default function ErrorText({ text }: Props) {
	return <div className='h-full w-full text-red-700'>{text}</div>;
}

interface Props {
	text: string;
}

