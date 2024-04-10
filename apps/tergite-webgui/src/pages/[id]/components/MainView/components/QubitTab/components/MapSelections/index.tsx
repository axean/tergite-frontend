import { Box, Select, Text } from '@chakra-ui/react';
import { useContext } from 'react';
import { BackendContext, MapActions, useMapData } from '@/state/BackendContext';
import RadioButtons from '@/components/primitives/RadioButtons';

export default function MapSelections({ selectType }: Props) {
	const { allData } = useMapData();
	const [{ nodeComponent, linkComponent, linkProperty, nodeProperty }, dispatch] =
		useContext(BackendContext);

	const selectionType = selectType === 'node' ? nodeComponent : linkComponent;
	const data = selectType === 'node' ? allData?.nodes : allData?.links;
	const defaultValue = selectType === 'node' ? nodeProperty : linkProperty;

	return data ? (
		<Box flex='1'>
			<RadioButtons
				dataAttribute={selectType}
				tabs={Object.keys(data)}
				defaultTab={selectionType}
				setTab={(value) => {
					dispatch({
						type:
							selectType === 'node'
								? MapActions.SET_NODE_COMPONENT
								: MapActions.SET_LINK_COMPONENT,
						payload: value as any
					});
				}}
			/>
			<Text fontSize='md' fontWeight='bold'>
				{selectType === 'node' ? 'Property:' : 'Connection property:'}
			</Text>

			<Select
				id='selectItem'
				defaultValue={defaultValue}
				data-cy-dropdown={selectType}
				onChange={(e) => {
					dispatch({
						type:
							selectType === 'node'
								? MapActions.SET_NODE_PROPERTY
								: MapActions.SET_LINK_PROPERTY,
						payload: e.target.value as any
					});
				}}
			>
				{Object.keys(data[selectionType][0]).map((key, index) => (
					<option key={index}> {key} </option>
				))}
			</Select>
		</Box>
	) : null;
}

interface Props {
	selectType: 'node' | 'link';
}
