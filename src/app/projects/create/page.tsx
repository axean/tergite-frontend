'use client';

import Page from '@/components/Page';
import HeaderBtn from '../components/HeaderBtn';
import PageHeader from '../components/PageHeader';
import { fetcher, post, raise } from '@/service/browser';
import { API } from '@/types';
import useSWRImmutable from 'swr/immutable';
import useSWRMutation from 'swr/mutation';
import { MouseEvent, useCallback, useState } from 'react';
import Form, { CustomInputEvent, MultiTextInput, TextInput, NumberInput } from '@/components/Form';

export default function CreateProject() {
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

	const handleSubmit = useCallback(
		(ev: MouseEvent<HTMLButtonElement>) => {
			ev.preventDefault();
			submit(newProject);
		},
		[newProject, submit]
	);

	const handleInputChange = useCallback(
		(ev: CustomInputEvent<string | string[] | number>) => {
			ev.preventDefault();
			const { name, value } = ev.target;
			setNewProject((prevObj) => ({ ...prevObj, [name]: value }));
		},
		[newProject, setNewProject]
	);

	return (
		<Page>
			<Form className='w-full h-full'>
				<PageHeader heading='Projects'>
					<HeaderBtn
						type='submit'
						text='Save'
						onClick={handleSubmit}
						disabled={isMutating}
					/>
				</PageHeader>

				<TextInput label='ExternalID' name='ext_id' required onChange={handleInputChange} />
				<NumberInput
					label='QPU Seconds'
					name='qpu_seconds'
					required
					onChange={handleInputChange}
				/>

				<MultiTextInput
					label="Users' Emails"
					name='user_emails'
					required
					onChange={handleInputChange}
				/>
			</Form>
		</Page>
	);
}
