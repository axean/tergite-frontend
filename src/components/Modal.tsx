'use client';
import { MouseEventHandler, PropsWithChildren } from 'react';
import Card from '@/components/Card';
import Overlay from './Overlay';

export default function Modal({
	children,
	onClose,
	className = 'w-1/3 xl:w-1/5 p-7',
	overlayClassName = ''
}: PropsWithChildren<Props>) {
	return (
		<Overlay className={overlayClassName}>
			<Card className={className}>
				<div className='w-full flex justify-end'>
					<button
						data-cy-close-btn
						className='p-2 rounded-r-md text-sm hover:bg-west-coast hover:text-white border border-slate-500'
						onClick={onClose}
					>
						x
					</button>
				</div>
				{children}
			</Card>
		</Overlay>
	);
}
interface Props {
	onClose: MouseEventHandler<HTMLButtonElement>;
	overlayClassName?: string;
	className?: string;
}
