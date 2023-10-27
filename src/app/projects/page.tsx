'use client';

import { API } from '@/types';
import DataTable from './components/DataTable';
import HeaderBtn from './components/HeaderBtn';
import PageHeader from './components/PageHeader';
import { fetcher, raise } from '@/service/browser';
import useSWR from 'swr';
import ErrorText from '@/components/ErrorText';
import Loading from '@/components/Loading';
import useSWRImmutable from 'swr/immutable';

const titles = [{ field: 'ext_id', className: 'w-auto md:w-4/5', label: 'ExternalID' }];

const actions = [
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
		<div className='h-full w-full'>
			<PageHeader heading='Projects'>
				<HeaderBtn text='Create' link='/projects/create' />
			</PageHeader>

			{isLoading && <Loading />}

			{data && (
				<DataTable titles={titles} actions={actions} data={data.data} getKey={getItemKey} />
			)}
		</div>
	);
}
