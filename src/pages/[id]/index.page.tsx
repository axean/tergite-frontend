import { Flex } from '@chakra-ui/react';
import React, { useState, useCallback, useEffect } from 'react';
import { useQuery } from 'react-query';
import Sidebar from './components/Sidebar';
import MainView, { Tabs } from './components/MainView';
import FullScreenLayout from '../../components/layouts/FullScreenLayout';
import DefaultSkeleton from '../../components/primitives/DefaultSkeleton';
import { getDevice } from '../../utils/api';
import { useAllLayouts } from '@/state/BackendContext';
import { facadeDeviceDetail } from '@/utils/facade';
import Detail from '../[id]';

export default function DeviceDetail({ id, tab }: Props) {
	const [isFullScreen, setSetFullScreen] = useState(false);
	const queryName = `device-detail-${id}`;

	const toggleSidebarVisibility = useCallback(
		() => setSetFullScreen(!isFullScreen),
		[isFullScreen]
	);

	const {
		isLoading,
		error,
		data: device
	} = useQuery<API.Response.DeviceDetail>(queryName, () => getDevice(`${id}`), {
		refetchInterval: 60_000 // refresh data every 1 minute
	});

	const { deviceLayouts, setDeviceLayouts } = useAllLayouts();
	useEffect(() => {
		if (!isLoading && device !== undefined) {
			setDeviceLayouts(facadeDeviceDetail(device));
		}
	}, [isLoading, device]);

	return (
		<DefaultSkeleton isLoading={isLoading} error={error}>
			<Flex flex='1' id={queryName} gap='2'>
				{device && (
					<>
						{!isFullScreen && (
							<Sidebar
								onVisibilityToggleClick={toggleSidebarVisibility}
								device={device}
							/>
						)}
						<MainView
							isFullscreen={isFullScreen}
							onFullScreenToggleBtnClick={toggleSidebarVisibility}
							tab={tab}
							device={device}
						/>
					</>
				)}
			</Flex>
		</DefaultSkeleton>
	);
}

interface Props {
	id: string;
	tab: Tabs;
}

DeviceDetail.getInitialProps = async (ctx) => ({
	id: await ctx.query.id,
	tab: await ctx.query.tab
});

DeviceDetail.getLayout = function (page) {
	return <FullScreenLayout>{page}</FullScreenLayout>;
};
