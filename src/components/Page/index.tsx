import { PropsWithChildren } from 'react';
export { HeaderBtn } from './HeaderBtn';
export { HeaderLinkBtn } from './HeaderLinkBtn';
export { PageHeader } from './PageHeader';
export { PageMain } from './PageMain';
export { PageSection } from './PageSection';

export default function Page({ className = '', children }: PropsWithChildren<Props>) {
	return (
		<div data-cy-content className={className}>
			{children}
		</div>
	);
}

interface Props {
	className?: string;
}
