'use client';

import { API } from '@/types';
import DataTable from './components/DataTable';
import HeaderBtn from './components/HeaderBtn';
import PageHeader from './components/PageHeader';
import { fetcher } from '@/service/browser';
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
	const { data: config, error: configError } = useSWRImmutable<API.Config>(
		`/api/config`,
		fetcher
	);
	const { data, error, isLoading } = useSWR(
		config ? `${config.baseUrl}/auth/projects` : null,
		fetcher<API.Response.Paginated<API.Project>>
	);

	return (
		<div className='h-full w-full'>
			<PageHeader heading='Projects'>
				<HeaderBtn text='Create' link='/projects/create' />
			</PageHeader>

			{isLoading && <Loading />}

			{data && (
				<DataTable titles={titles} actions={actions} data={data.data} getKey={getItemKey} />
			)}

			{configError && <ErrorText text={configError.message} />}
			{error && <ErrorText text={error.message} />}
		</div>
	);
}
