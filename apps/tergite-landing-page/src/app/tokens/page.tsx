'use client';

import { API } from '@/types';
import DataTable from '@/components/DataTable';
import { fetcher, getTokenInfo, raise } from '@/service/browser';
import useSWR from 'swr';
import Spinner from '@/components/Spinner';
import useSWRImmutable from 'swr/immutable';
import Page, { HeaderLinkBtn, PageHeader, PageMain } from '@/components/Page';
import { useMemo } from 'react';

const titles = [
	{ field: 'name', className: 'w-auto', label: 'Name' },
	{ field: 'project', className: 'w-auto', label: 'Project' },
	{ field: 'expiration', className: 'w-auto', label: 'Expires' },
	{ field: 'status', className: 'w-auto', label: 'Status' }
];

const actions = [
	{ getLabel: () => 'View', getLink: ({ id }: API.TokenInfo) => `/tokens/${id}` },
	{ getLabel: () => 'Delete', getLink: ({ id }: API.TokenInfo) => `/tokens/${id}/del` }
];

const getItemKey = ({ id }: API.TokenInfo) => id;

export default function Tokens() {
	const { data: config, error: configErr } = useSWRImmutable<API.Config>(`/api/config`, fetcher);
	configErr && raise(configErr);

	const { data, isLoading, error } = useSWR(
		config ? `${config.baseUrl}/auth/me/app-tokens/` : null,
		fetcher<API.Response.Paginated<API.AppToken>>
	);
	error && raise(error);

	const tokenInfoList = useMemo(() => data?.data?.map(getTokenInfo), [data?.data]);

	return (
		<Page className='h-full w-full'>
			<PageHeader heading='My Tokens'>
				<HeaderLinkBtn text='Generate' link='/tokens/create' />
			</PageHeader>

			<PageMain>
				{isLoading && <Spinner />}

				{tokenInfoList && (
					<DataTable
						titles={titles}
						actions={actions}
						data={tokenInfoList}
						getKey={getItemKey}
					/>
				)}
			</PageMain>
		</Page>
	);
}
