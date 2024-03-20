import { SimpleGrid } from '@chakra-ui/react';
import React, { useCallback, useMemo, useState } from 'react';
import { useQuery } from 'react-query';
import BackendCard from './components/BackendCard';
import NextLink from 'next/link';
import Toolbar from './components/Toolbar';
import DefaultSkeleton from '../../../../components/primitives/DefaultSkeleton';
import { getAllDevices } from '../../../../utils/api';
import { filterParser, getValueAtPath } from './utils';

export default function BackendsGrid({ title }: Props) {
	const [search, setSearch] = useState('');
	const [sort, setSort] = useState({ order: 'asc', option: 'name' });
	const [filter, setFilter] = useState(['online', 'offline']);

	const {
		isLoading,
		data: backends,
		error
	} = useQuery<API.Response.Device[]>(
		'getAllDevices',
		getAllDevices,
		{ refetchInterval: 60_000 } // refetch every minute
	);

	const searchFilterAndSortDevices = useCallback(
		(list) => {
			if (isLoading || error || !list) return [];

			const searchRegex = new RegExp(search, 'i');
			const filtered = list.filter(
				(item) => filter.includes(filterParser(item)) && searchRegex.test(item.name)
			);

			const sortCoefficient = sort.order === 'asc' ? 1 : -1;
			const sortOptionPath = sort.option.split('.');

			return filtered.sort(
				(a, b) =>
					sortCoefficient *
					getValueAtPath(a, sortOptionPath)
						?.toString()
						?.localeCompare(getValueAtPath(b, sortOptionPath))
			);
		},
		[search, sort.order, sort.option, filter, isLoading, error]
	);

	const sortedBackends = useMemo(() => {
		return searchFilterAndSortDevices(backends);
	}, [backends, searchFilterAndSortDevices]);

	return (
		<>
			<Toolbar
				title={title}
				search={search}
				setSearch={setSearch}
				sort={sort}
				setSort={setSort}
				filter={filter}
				setFilter={setFilter}
			/>
			<DefaultSkeleton isLoading={isLoading} error={error}>
				<SimpleGrid columns={4} gap='8' mb='4' data-cy-devices>
					{sortedBackends.map((backend, index) => (
						<NextLink href={`/${backend.name}`} key={index}>
							<BackendCard key={index} {...backend} />
						</NextLink>
					))}
				</SimpleGrid>
			</DefaultSkeleton>
		</>
	);
}

interface Props {
	title: string;
}
