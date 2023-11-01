'use client';

import Page, { HeaderBtn, PageHeader } from '@/components/Page';
import { fetcher, post, raise, updater } from '@/service/browser';
import { API } from '@/types';
import useSWRImmutable from 'swr/immutable';
import useSWRMutation from 'swr/mutation';
import { MouseEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Form, { CustomInputEvent, MultiInput, Input } from '@/components/Form';
import { useParams, useRouter } from 'next/navigation';
import PageMain from '@/components/Page/PageMain';

export default function EditProject() {
	const { id } = useParams();
	const router = useRouter();
	const [project, setProject] = useState<API.ProjectPartial>();

	const configGetter = useSWRImmutable<API.Config>(`/api/config`, fetcher);
	configGetter.error && raise(configGetter.error);

	const swrKey = configGetter.data ? `${configGetter.data.baseUrl}/auth/projects/${id}` : null;
	const mutator = useSWRMutation(swrKey, updater<API.ProjectPartial>);
	mutator.error && raise(mutator.error);

	const { isMutating } = mutator;
	const btnText = useMemo(() => (isMutating ? 'Saving...' : 'Save'), [isMutating]);

	const handleSubmit = useCallback(
		(ev: MouseEvent<HTMLButtonElement>) => {
			ev.preventDefault();
			mutator
				.trigger(project)
				.then(() => {
					router.push(`/projects/${id}`);
				})
				.catch(console.error);
		},
		[project, mutator]
	);

	const handleInputChange = useCallback(
		(ev: CustomInputEvent<string | number | (string | number)[]>) => {
			ev.preventDefault();
			const { name, value } = ev.target;
			setProject((prevObj) => ({ ...(prevObj || {}), [name]: value }));
		},
		[project, setProject]
	);

	useEffect(() => {
		if (configGetter.data && project === undefined) {
			const url = `${configGetter.data.baseUrl}/auth/projects/${id}`;
			fetcher<API.Project>(url).then((resp) => {
				setProject({ ...resp });
			});
		}
	}, [id, configGetter, setProject, project]);

	return (
		<Page className='h-full w-full'>
			<Form className='w-full h-full'>
				<PageHeader heading='Projects'>
					<HeaderBtn
						type='submit'
						text={btnText}
						onClick={handleSubmit}
						disabled={isMutating}
					/>
				</PageHeader>

				<PageMain className='py-10 px-5'>
					{project && (
						<>
							<Input
								type='text'
								value={project.ext_id}
								label='External ID'
								name='ext_id'
								disabled
								required
								onChange={handleInputChange}
							/>

							<Input
								label='QPU Seconds'
								value={project.qpu_seconds}
								type='number'
								name='qpu_seconds'
								required
								onChange={handleInputChange}
							/>

							<MultiInput
								label='User Emails'
								value={project.user_emails}
								name='user_emails'
								type='email'
								required
								onChange={handleInputChange}
							/>
						</>
					)}
				</PageMain>
			</Form>
		</Page>
	);
}
