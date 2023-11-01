'use client';

import Page, { HeaderLinkBtn, PageHeader } from '@/components/Page';
import { fetcher, raise } from '@/service/browser';
import { API } from '@/types';
import useSWRImmutable from 'swr/immutable';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import ContentSection from './ContentSection';

export default function ProjectDetail() {
	const { id } = useParams();

	const configGetter = useSWRImmutable<API.Config>(`/api/config`, fetcher);
	configGetter.error && raise(configGetter.error);

	const swrKey = configGetter.data ? `${configGetter.data.baseUrl}/auth/projects/${id}` : null;

	const { data: project, error } = useSWR(swrKey, fetcher<API.Project>);
	error && raise(error);

	return (
		<Page>
			<PageHeader heading='Projects'>
				<div className='flex justify-between h-full'>
					<HeaderLinkBtn text='Edit' link={`/projects/${id}/edit`} />
					<HeaderLinkBtn text='Delete' link={`/projects/${id}/del`} />
				</div>
			</PageHeader>

			{project && (
				<>
					<ContentSection>
						<p className='font-bold'>ExternalID</p>
						<p className='font-semibold'>{project.ext_id}</p>
					</ContentSection>

					<ContentSection>
						<p className='font-bold'>QPU Seconds</p>
						<p className='font-semibold'>{project.qpu_seconds}</p>
					</ContentSection>

					<ContentSection>
						<p className='font-bold'>Users</p>
						<div className='font-semibold'>
							{project.user_emails?.map((email, index) => (
								<p key={index} className='py-2'>
									{email}
								</p>
							))}
						</div>
					</ContentSection>
				</>
			)}
		</Page>
	);
}
