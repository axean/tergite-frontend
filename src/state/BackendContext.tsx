import React, { ReactNode, useState, useReducer, useContext, useMemo } from 'react';

export type BackendContextState = {
	selectedNode: number;
	selectedLink: number;
	deviceLayouts: Nullable<Application.DeviceLayouts>;
	nodeComponent: Application.NodeKeys;
	linkComponent: Application.LinkKeys;
	showNodeSelectorMap: boolean;
	showLinkSelectorMap: boolean;
	nodeProperty: string;
	linkProperty: string;
	type1Data: Nullable<Application.Type1>;
	timeFrom: Date;
	timeTo: Date;
};

type Reducer = Parameters<typeof reducer>[1];

type BackendContextProps = [BackendContextState, React.Dispatch<Reducer>];

export enum MapActions {
	SELECT_NODE = 'SELECT_NODE',
	SELECT_LINK = 'SELECT_LINK',
	SET_LAYOUTS = 'SET_LAYOUTS',
	SET_SHOW_SELECTOR_MAPS = 'SET_SHOW_SELECTOR_MAPS',
	SET_MAP_DATA = 'SET_MAP_DATA',
	SET_NODE_COMPONENT = 'SET_NODE_COMPONENT',
	SET_LINK_COMPONENT = 'SET_LINK_COMPONENT',
	SET_NODE_PROPERTY = 'SET_NODE_PROPERTY',
	SET_LINK_PROPERTY = 'SET_LINK_PROPERTY'
}

export enum DateActions {
	SET_TIME_FROM = 'SET_TIME_FROM',
	SET_TIME_TO = 'SET_TIME_TO'
}

function reducer(
	state: BackendContextState,
	action:
		| { type: DateActions; payload: Date }
		| {
				type: MapActions;
				payload:
					| { showNodeSelectorMap: boolean; showLinkSelectorMap: boolean }
					| Application.Type1
					| Application.DeviceLayouts
					| Application.NodeKeys
					| Application.LinkKeys
					| Application.Id;
		  }
): BackendContextState {
	switch (action.type) {
		case MapActions.SET_SHOW_SELECTOR_MAPS:
			return {
				...state,
				showLinkSelectorMap: (
					action.payload as {
						showNodeSelectorMap: boolean;
						showLinkSelectorMap: boolean;
					}
				).showLinkSelectorMap,
				showNodeSelectorMap: (
					action.payload as { showNodeSelectorMap: boolean; showLinkSelectorMap: boolean }
				).showNodeSelectorMap
			};
		case MapActions.SELECT_NODE:
			return { ...state, selectedNode: action.payload as Application.Id };
		case MapActions.SELECT_LINK:
			return { ...state, selectedLink: action.payload as Application.Id };
		case MapActions.SET_LAYOUTS:
			return { ...state, deviceLayouts: action.payload as Application.DeviceLayouts };
		case MapActions.SET_MAP_DATA:
			return { ...state, type1Data: action.payload as Application.Type1 };
		case MapActions.SET_NODE_COMPONENT:
			return { ...state, nodeComponent: action.payload as Application.NodeKeys };
		case MapActions.SET_LINK_COMPONENT:
			return { ...state, linkComponent: action.payload as Application.LinkKeys };
		case MapActions.SET_LINK_PROPERTY:
			return { ...state, linkProperty: action.payload as string };
		case MapActions.SET_NODE_PROPERTY:
			return { ...state, nodeProperty: action.payload as string };
		case DateActions.SET_TIME_FROM:
			return { ...state, timeFrom: action.payload };
		case DateActions.SET_TIME_TO:
			return { ...state, timeTo: action.payload };
	}
}

// @ts-expect-error
export const BackendContext = React.createContext<BackendContextProps>(null);

type BackendContextProviderProps = {
	children: ReactNode;
};
const BackendContextProvider: React.FC<BackendContextProviderProps> = ({ children }) => {
	let timeFrom = new Date();
	timeFrom.setDate(timeFrom.getDate() - 7);
	const data: BackendContextState = {
		showLinkSelectorMap: false,
		showNodeSelectorMap: false,
		type1Data: null,
		deviceLayouts: null,
		selectedNode: -1,
		selectedLink: -1,
		nodeComponent: 'one_qubit_gates',
		linkComponent: 'two_qubit_gates',
		nodeProperty: 'pulse_amp',
		linkProperty: 'pulse_amp',
		timeFrom,
		timeTo: new Date()
	};
	const x = useReducer(reducer, data);

	return <BackendContext.Provider value={x}>{children}</BackendContext.Provider>;
};

/** This function is used to get and set the qubitmap layouts */
export const useAllLayouts = (): {
	deviceLayouts: Nullable<Application.DeviceLayouts>;
	setDeviceLayouts: (layouts: Application.DeviceLayouts) => void;
} => {
	const [{ deviceLayouts }, dispatch] = useContext(BackendContext);

	const setDeviceLayouts = (layouts: Application.DeviceLayouts) => {
		dispatch({ type: MapActions.SET_LAYOUTS, payload: layouts });
	};

	return { deviceLayouts, setDeviceLayouts };
};
/** This function returns the layout of the selected components */
export const useSelectedComponentLayout = (): {
	layout: Nullable<Application.DeviceLayout>;
} => {
	const [{ deviceLayouts, nodeComponent, linkComponent }, _] = useContext(BackendContext);

	return {
		layout: {
			nodes: deviceLayouts?.nodeLayouts[nodeComponent],
			links: deviceLayouts?.linkLayouts[linkComponent]
		}
	};
};
/** This function returns the type1 data, the selected component data and the selected component property data and a modifier function */
export function useMapData() {
	const [{ type1Data, nodeComponent, linkComponent, nodeProperty, linkProperty }, dispatch] =
		useContext(BackendContext);
	const setMapData = (mapData) => {
		dispatch({ type: MapActions.SET_MAP_DATA, payload: mapData });
	};

	const selectedComponentData = {
		nodeData: type1Data?.nodes[nodeComponent],
		linkData: type1Data?.links[linkComponent]
	};

	const selectedComponentPropertyData = {
		nodeData: type1Data?.nodes[nodeComponent].map((c) => {
			if (nodeProperty === 'id') return { id: c.id };
			return { data: c[nodeProperty], id: c.id };
		}),

		linkData: type1Data?.links[linkComponent].map((c) => {
			if (linkProperty === 'id') return { id: c.id };
			return { data: c[linkProperty], id: c.id };
		})
	};

	return { allData: type1Data, selectedComponentData, selectedComponentPropertyData, setMapData };
}
/** This fuction is used to controll the side panel */
export const useSelectionMaps = () => {
	const [{ showLinkSelectorMap, showNodeSelectorMap }, dispatch] = useContext(BackendContext);

	const setSelectionMap = (showLinkSelectorMap: boolean, showNodeSelectorMap: boolean) => {
		dispatch({
			type: MapActions.SET_SHOW_SELECTOR_MAPS,
			payload: { showLinkSelectorMap, showNodeSelectorMap }
		});
	};

	return { showLinkSelectorMap, showNodeSelectorMap, setSelectionMap };
};

export default BackendContextProvider;
