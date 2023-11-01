'use client';

import Page, { HeaderBtn, PageHeader } from '@/components/Page';
import { fetcher, post, raise } from '@/service/browser';
import { API } from '@/types';
import useSWRImmutable from 'swr/immutable';
import useSWRMutation from 'swr/mutation';
import { MouseEvent, useCallback, useMemo, useState } from 'react';
import Form, { CustomInputEvent, MultiInput, Input } from '@/components/Form';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';

export default function CreateProject() {
	const { data: user, error: authError } = useSWR('/api/me', fetcher<API.User>);
	const isAdmin = useMemo(() => user?.roles.includes(API.UserRole.ADMIN), [user]);
	authError && raise(authError);

	if (user && !isAdmin) {
		const forbiddenError = new Error('Unauthorized');
		// @ts-ignore
		forbiddenError.status = 403;
		raise(forbiddenError);
	}

	const router = useRouter();
	const { data: config, error: configErr } = useSWRImmutable<API.Config>(`/api/config`, fetcher);
	configErr && raise(configErr);

	const swrKey = config ? `${config.baseUrl}/auth/projects` : null;
	const {
		trigger: submit,
		isMutating,
		error
	} = useSWRMutation(swrKey, post<API.ProjectPartial>, {
		populateCache: false,
		revalidate: false
	});
	error && raise(error);

	const [newProject, setNewProject] = useState<API.ProjectPartial>({
		ext_id: '',
		user_emails: [],
		qpu_seconds: 0
	});

	const btnText = useMemo(() => (isMutating ? 'Saving...' : 'Save'), [isMutating]);

	const handleSubmit = useCallback(
		async (ev: MouseEvent<HTMLButtonElement>) => {
			ev.preventDefault();
			const response = await submit(newProject);
			router.push(`/projects/${response.id}`);
		},
		[router, submit, newProject]
	);

	const handleInputChange = useCallback(
		(ev: CustomInputEvent<string | number | (string | number)[]>) => {
			ev.preventDefault();
			const { name, value } = ev.target;
			setNewProject((prevObj) => ({ ...prevObj, [name]: value }));
		},
		[setNewProject]
	);

	return (
		<Page className='w-full h-full'>
			<Form className='w-full h-full'>
				<PageHeader heading='Projects'>
					<HeaderBtn
						type='submit'
						text={btnText}
						onClick={handleSubmit}
						disabled={isMutating}
					/>
				</PageHeader>

				<Input
					type='text'
					value={newProject.ext_id}
					label='External ID'
					name='ext_id'
					required
					onChange={handleInputChange}
				/>

				<Input
					label='QPU Seconds'
					value={newProject.qpu_seconds}
					type='number'
					name='qpu_seconds'
					required
					onChange={handleInputChange}
				/>

				<MultiInput
					label='User Emails'
					value={newProject.user_emails}
					name='user_emails'
					type='email'
					required
					onChange={handleInputChange}
				/>
			</Form>
		</Page>
	);
}
