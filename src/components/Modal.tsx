'use client';
import { MouseEventHandler, PropsWithChildren } from 'react';
import Card from '@/components/Card';
import Overlay from './Overlay';

export default function Modal({
	children,
	onClose,
	className = '',
	overlayClassName = ''
}: PropsWithChildren<Props>) {
	return (
		<Overlay className={overlayClassName}>
			<Card className={className}>
				<div className='w-full flex justify-end'>
					<button
						data-cy-close-btn
						className='px-2 py-[0.15rem] text-sm hover:bg-west-coast hover:text-white font-semibold rounded-sm'
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
