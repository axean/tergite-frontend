'use client';

import { API } from '@/types';
import DataTable from './components/DataTable';
import HeaderBtn from './components/HeaderBtn';
import PageHeader from './components/PageHeader';
import { fetcher } from '@/service/browser';
import useSWR from 'swr';
import ErrorText from '@/components/ErrorText';
import Loading from '@/components/Loading';

const titles = [{ field: 'ext_id', className: 'w-4/5', label: 'ExternalID' }];

const actions = [
	{ getLabel: () => 'Edit', getLink: ({ ext_id }: API.Project) => `/projects/${ext_id}/edit` },
	{ getLabel: () => 'Delete', getLink: ({ ext_id }: API.Project) => `/projects/${ext_id}/del` }
];

const getItemKey = ({ ext_id }: API.Project) => ext_id;

export default function Projects() {
	const { data, error, isLoading } = useSWR(
		'/api/projects',
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

			{error && <ErrorText text={error} />}
		</div>
	);
}
