export default function ServiceLink({ href, text }: Tergite.ServiceLinkInfo) {
	return (
		<a
			data-cy-app-button
			href={href}
			className='block w-full border-b-4 border-blue-300 bg-west-coast px-4 py-3 text-left font-bold text-white outline-none focus:ring-2 focus:ring-inset focus:ring-white focus:ring-offset-2 focus:ring-offset-west-coast'
		>
			{text}
		</a>
	);
}
