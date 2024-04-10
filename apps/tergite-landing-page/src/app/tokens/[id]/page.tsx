'use client';

import Page, { HeaderLinkBtn, PageHeader } from '@/components/Page';
import { fetcher, getTokenInfo, raise } from '@/service/browser';
import { API } from '@/types';
import useSWRImmutable from 'swr/immutable';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { PageMain, PageSection } from '@/components/Page';
import { useMemo } from 'react';

export default function TokenDetail() {
	const { id } = useParams();

	const configGetter = useSWRImmutable<API.Config>(`/api/config`, fetcher);
	configGetter.error && raise(configGetter.error);

	const swrKey = configGetter.data
		? `${configGetter.data.baseUrl}/auth/me/app-tokens/${id}`
		: null;

	const { data: token, error } = useSWR(swrKey, fetcher<API.AppToken>);
	error && raise(error);

	const tokenInfo = useMemo(() => token && getTokenInfo(token), [token]);

	return (
		<Page className='h-full w-full'>
			<PageHeader heading={`Token '${tokenInfo?.name}' for Project '${tokenInfo?.project}'`}>
				<div className='flex justify-between h-full'>
					<HeaderLinkBtn
						text='Delete'
						className='bg-red-500 hover:bg-red-400 text-white border-red-500 hover:text-white'
						link={`/tokens/${id}/del`}
					/>
				</div>
			</PageHeader>

			<PageMain>
				{tokenInfo && (
					<>
						<PageSection title='Name'>
							<p>{tokenInfo.name}</p>
						</PageSection>

						<PageSection title='Project'>
							<p>{tokenInfo.project}</p>
						</PageSection>

						<PageSection title='Expires'>
							<p>{tokenInfo.expiration}</p>
						</PageSection>

						<PageSection title='Status'>
							<p>{tokenInfo.status}</p>
						</PageSection>
					</>
				)}
			</PageMain>
		</Page>
	);
}
