'use client';

import ErrorText from '@/components/ErrorText';
import { destroyer, fetcher } from '@/service/browser';
import { API } from '@/types';
import { useParams, useRouter } from 'next/navigation';
import { ChangeEvent, MouseEvent, useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import useSWRImmutable from 'swr/immutable';
import TextInput from './components/TextInput';
import Card, { CardBtn, CardFooter, CardHeader } from './components/Card';

export default function DelProject() {
	const { id } = useParams();
	const router = useRouter();
	const [isBtnEnabled, setIsBtnEnabled] = useState<boolean>(false);

	const configGetter = useSWRImmutable<API.Config>(`/api/config`, fetcher);
	const swrKey = configGetter.data ? `${configGetter.data.baseUrl}/auth/projects/${id}` : null;
	const mutator = useSWRMutation(swrKey, destroyer, { populateCache: false, revalidate: false });
	const getter = useSWR<API.Project>(swrKey, fetcher);

	const { isMutating } = mutator;
	const btnText = useMemo(() => (isMutating ? 'Deleting...' : 'Delete'), [isMutating]);

	const handleTextInput = useCallback(
		(ev: ChangeEvent<HTMLInputElement>) => {
			ev.preventDefault();
			const ext_id = getter.data?.ext_id;
			ext_id && setIsBtnEnabled(ev.target.value === ext_id);
		},
		[getter.data]
	);

	const handleBtnClick = useCallback(
		async (ev: MouseEvent<HTMLButtonElement>) => {
			ev.preventDefault();
			await mutator.trigger();
			router && router.back();
		},
		[router, mutator.trigger]
	);

	return (
		<div className='flex flex-1 justify-center items-center'>
			<Card>
				<CardHeader title={`Delete Project '${getter.data?.ext_id}'?`} />

				<TextInput
					label={`Confirm project's external ID '${getter.data?.ext_id}'`}
					onChange={handleTextInput}
					labelClassName='after:text-red-500'
					inputClassName='focus:border-sky-500 focus:ring-sky-500'
					required
				/>

				{configGetter.error && (
					<ErrorText className='mb-5 py-5 px-10' text={configGetter.error.message} />
				)}

				{getter.error && (
					<ErrorText className='mb-5 py-5 px-10' text={getter.error.message} />
				)}

				{mutator.error && (
					<ErrorText className='mb-5 py-5 px-10' text={mutator.error.message} />
				)}

				<CardFooter className='flex justify-end'>
					<CardBtn
						label={btnText}
						disabled={!isBtnEnabled || mutator.isMutating}
						onClick={handleBtnClick}
						className='bg-red-500 text-white hover:bg-red-300 border-red-900 disabled:bg-red-300'
					/>
				</CardFooter>
			</Card>
		</div>
	);
}
