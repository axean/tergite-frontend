export function CardHeader({ title, className = '' }: Props) {
	return (
		<h3
			className={`text-west-coast text-2xl font-semibold border-b border-west-coast-200 mb-10 px-10 py-5 ${className}`}
		>
			{title}
		</h3>
	);
}
interface Props {
	title: string;
	className?: string;
}
