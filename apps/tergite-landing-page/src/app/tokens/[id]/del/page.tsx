'use client';

import { destroyer, fetcher, raise } from '@/service/browser';
import { API } from '@/types';
import { useParams, useRouter } from 'next/navigation';
import { ChangeEvent, MouseEvent, useCallback, useMemo, useState } from 'react';
import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import useSWRImmutable from 'swr/immutable';
import { Input } from '@/components/Form';
import Card, { CardBtn, CardFooter, CardHeader } from '@/components/Card';
import Page from '@/components/Page';

export default function DeleteToken() {
	const { id } = useParams();
	const router = useRouter();
	const [isBtnEnabled, setIsBtnEnabled] = useState<boolean>(false);

	const configGetter = useSWRImmutable<API.Config>(`/api/config`, fetcher);
	configGetter.error && raise(configGetter.error);

	const swrKey = configGetter.data
		? `${configGetter.data.baseUrl}/auth/me/app-tokens/${id}`
		: null;

	const getter = useSWR<API.AppToken>(swrKey, fetcher);
	getter.error && raise(getter.error);

	const mutator = useSWRMutation(swrKey, destroyer, { populateCache: false, revalidate: false });
	mutator.error && raise(mutator.error);

	const handleTextInput = useCallback(
		(ev: ChangeEvent<HTMLInputElement>) => {
			ev.preventDefault();
			const ext_id = getter.data?.project_ext_id;
			ext_id && setIsBtnEnabled(ev.target.value === ext_id);
		},
		[getter.data]
	);

	const handleBtnClick = useCallback(
		async (ev: MouseEvent<HTMLButtonElement>) => {
			ev.preventDefault();
			await mutator.trigger();
			if (window?.history?.state?.idx > 0) {
				router && router.back();
			} else {
				router && router.push('/tokens');
			}
		},
		[router, mutator]
	);

	return (
		<Page className='flex flex-1 justify-center items-center'>
			{getter.data && (
				<Card>
					<CardHeader title={`Delete Token '${getter.data.title}'?`} />

					<Input
						type='text'
						label={`Confirm token's project external ID '${getter.data.project_ext_id}'`}
						onChange={handleTextInput}
						labelClassName='after:text-red-500'
						inputClassName='focus:border-sky-500 focus:ring-sky-500'
						required
					/>

					<CardFooter className='flex justify-end'>
						<CardBtn
							label='Delete'
							isLoading={mutator.isMutating}
							disabled={!isBtnEnabled || mutator.isMutating}
							onClick={handleBtnClick}
							className='bg-red-500 text-white hover:bg-red-300 border-red-900 disabled:bg-red-300'
						/>
					</CardFooter>
				</Card>
			)}
		</Page>
	);
}
