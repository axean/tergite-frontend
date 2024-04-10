'use client';

import Page, { HeaderLinkBtn, PageHeader } from '@/components/Page';
import { fetcher, raise } from '@/service/browser';
import { API } from '@/types';
import useSWRImmutable from 'swr/immutable';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { PageMain, PageSection } from '@/components/Page';

export default function ProjectDetail() {
	const { id } = useParams();

	const configGetter = useSWRImmutable<API.Config>(`/api/config`, fetcher);
	configGetter.error && raise(configGetter.error);

	const swrKey = configGetter.data ? `${configGetter.data.baseUrl}/auth/projects/${id}` : null;

	const { data: project, error } = useSWR(swrKey, fetcher<API.Project>);
	error && raise(error);

	return (
		<Page className='h-full w-full'>
			<PageHeader heading={`Project '${project?.ext_id}'`}>
				<div className='flex justify-between h-full'>
					<HeaderLinkBtn text='Edit' link={`/projects/${id}/edit`} />
					<HeaderLinkBtn
						text='Delete'
						className='bg-red-500 hover:bg-red-400 text-white border-red-500 hover:text-white'
						link={`/projects/${id}/del`}
					/>
				</div>
			</PageHeader>

			<PageMain>
				{project && (
					<>
						<PageSection title='External ID'>
							<p>{project.ext_id}</p>
						</PageSection>

						<PageSection title='QPU Seconds'>
							<p>{project.qpu_seconds}</p>
						</PageSection>

						<PageSection title='Users'>
							<div>
								{project.user_emails?.map((email, index) => (
									<p key={index} className='py-2'>
										{email}
									</p>
								))}
							</div>
						</PageSection>
					</>
				)}
			</PageMain>
		</Page>
	);
}
