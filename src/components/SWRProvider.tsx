'use client';
import { PropsWithChildren } from 'react';
import { SWRConfig } from 'swr';

export default function SWRProvider({ children, fallback }: PropsWithChildren<Props>) {
	return <SWRConfig value={{ fallback }}>{children}</SWRConfig>;
}

interface Props {
	fallback: { [key: string]: any };
}
