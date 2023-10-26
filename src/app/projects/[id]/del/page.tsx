'use client';

import ErrorText from '@/components/ErrorText';
import { destroyer, fetcher } from '@/service/browser';
import { API } from '@/types';
import { useParams, useRouter } from 'next/navigation';
import { ChangeEvent, MouseEvent, useCallback, useMemo, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import useSWRMutation from 'swr/mutation';
import useSWRImmutable from 'swr/immutable';

export default function DelProject() {
	const { id } = useParams();
	const router = useRouter();
	const [isBtnEnabled, setIsBtnEnabled] = useState<boolean>(false);
	const { mutate } = useSWRConfig();

	const { data: config, error: configError } = useSWRImmutable<API.Config>(
		`/api/config`,
		fetcher
	);
	const { trigger, isMutating, error } = useSWRMutation(
		config ? `${config.baseUrl}/auth/projects/${id}` : null,
		destroyer,
		{ populateCache: false, revalidate: false }
	);
	const btnText = useMemo(() => (isMutating ? 'Deleting...' : 'Delete'), [isMutating]);
	const { data: project, error: projectError } = useSWR<API.Project>(
		config ? `${config.baseUrl}/auth/projects/${id}` : null,
		fetcher
	);

	const handleTextInput = useCallback(
		(ev: ChangeEvent<HTMLInputElement>) => {
			ev.preventDefault();
			project && setIsBtnEnabled(ev.target.value === project.ext_id);
		},
		[project]
	);

	const handleBtnClick = useCallback(
		async (ev: MouseEvent<HTMLButtonElement>) => {
			ev.preventDefault();
			try {
				await trigger(config);
				// await mutate(
				// 	(key) => typeof key === 'string' && /\/(api|auth)(\/me)?\/projects/.test(key)
				// );
				router.back();
			} catch (error) {
				console.error(error);
			}
		},
		[mutate, router, config]
	);

	return (
		<div className='flex flex-1 justify-center items-center'>
			<div className='bg-white  border border-west-coast-300 rounded'>
				<h3 className='text-west-coast text-2xl font-semibold border-b border-west-coast-200 mb-10 px-10 py-5'>{`Delete Project '${project?.ext_id}'?`}</h3>
				<label className='block mb-5 px-10 py-5'>
					<span className="after:content-['*'] after:ml-0.5 after:text-red-500 block text-lg font-medium text-slate-700">
						{`Confirm project's external ID '${project?.ext_id}'`}
					</span>
					<input
						type='text'
						className='mt-1 px-3 py-2 bg-white border shadow-sm border-slate-300 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-sky-500 block w-full rounded-md sm:text-md focus:ring-1'
						onChange={handleTextInput}
					/>
				</label>

				{configError && (
					<ErrorText className='mb-5 py-5 px-10' text={configError.message} />
				)}

				{projectError && (
					<ErrorText className='mb-5 py-5 px-10' text={projectError.message} />
				)}

				{error && <ErrorText className='mb-5 py-5 px-10' text={error.message} />}

				<div className='flex justify-end py-5 px-10 border-t border-west-coast-200'>
					<button
						className='rounded bg-red-500 text-white py-2 px-7 hover:bg-red-300 font-semibold text-lg border border-red-900 hover:border-transparent disabled:border-transparent disabled:bg-red-300'
						disabled={!isBtnEnabled || isMutating}
						onClick={handleBtnClick}
					>
						{btnText}
					</button>
				</div>
			</div>
		</div>
	);
}
