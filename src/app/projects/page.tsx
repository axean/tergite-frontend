'use client';

import { API } from '@/types';
import DataTable from '@/components/DataTable';
import { fetcher, raise } from '@/service/browser';
import useSWR from 'swr';
import Loading from '@/components/Loading';
import useSWRImmutable from 'swr/immutable';
import Page, { HeaderLinkBtn, PageHeader } from '@/components/Page';
import PageMain from '@/components/Page/PageMain';

const titles = [{ field: 'ext_id', className: 'w-auto md:w-4/5', label: 'External ID' }];

const actions = [
	{ getLabel: () => 'View', getLink: ({ id }: API.Project) => `/projects/${id}` },
	{ getLabel: () => 'Edit', getLink: ({ id }: API.Project) => `/projects/${id}/edit` },
	{ getLabel: () => 'Delete', getLink: ({ id }: API.Project) => `/projects/${id}/del` }
];

const getItemKey = ({ id }: API.Project) => id;

export default function Projects() {
	const { data: config, error: configErr } = useSWRImmutable<API.Config>(`/api/config`, fetcher);
	configErr && raise(configErr);

	const { data, isLoading, error } = useSWR(
		config ? `${config.baseUrl}/auth/projects` : null,
		fetcher<API.Response.Paginated<API.Project>>
	);
	error && raise(error);

	return (
		<Page className='h-full w-full'>
			<PageHeader heading='Projects'>
				<HeaderLinkBtn text='Create' link='/projects/create' />
			</PageHeader>

			<PageMain>
				{isLoading && <Loading />}

				{data && (
					<DataTable
						titles={titles}
						actions={actions}
						data={data.data}
						getKey={getItemKey}
					/>
				)}
			</PageMain>
		</Page>
	);
}
