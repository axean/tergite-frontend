export default function HeaderCell({ text, className = '' }: Props) {
	return (
		<th
			className={`border-b font-medium p-4 pl-8 pt-8 pb-3 text-slate-400 text-left ${className}`}
		>
			{text}
		</th>
	);
}
interface Props {
	className?: string;
	text: string;
}
