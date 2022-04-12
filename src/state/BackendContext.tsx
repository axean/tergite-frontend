import React, { ReactNode, useState, useReducer } from 'react';

export type BackendContextState = {
	selectedNode: number;
	selectedLink: number;
	timeFrom: Date;
	timeTo: Date;
	nodes: Point[];
	links: Link[];
};

type BackendContextProps = [
	BackendContextState,
	React.Dispatch<{ type: DateActions; payload: Date } | { type: MapActions; payload: number }>
];

export enum MapActions {
	SELECT_NODE = 0,
	SELECT_LINK
}

export enum DateActions {
	SET_TIME_FROM = 2,
	SET_TIME_TO
}

function reducer(
	state: BackendContextState,
	action: { type: DateActions; payload: Date } | { type: MapActions; payload: number }
): BackendContextState {
	switch (action.type) {
		case MapActions.SELECT_NODE:
			return { ...state, selectedNode: action.payload };
		case MapActions.SELECT_LINK:
			return { ...state, selectedLink: action.payload };
		case DateActions.SET_TIME_FROM:
			return { ...state, timeFrom: action.payload };
		case DateActions.SET_TIME_TO:
			return { ...state, timeTo: action.payload };
	}
}
const BackendContext = React.createContext<BackendContextProps>(null);

type BackendContextProviderProps = {
	children: ReactNode;
};
const BackendContextProvider: React.FC<BackendContextProviderProps> = ({ children }) => {
	let timeFrom = new Date();
	timeFrom.setDate(timeFrom.getDate() - 7);
	const data: BackendContextState = {
		selectedNode: -1,
		selectedLink: -1,
		timeFrom,
		timeTo: new Date(),
		nodes: [],
		links: []
	};
	const x = useReducer(reducer, data);
	return <BackendContext.Provider value={x}>{children}</BackendContext.Provider>;
};
export default BackendContextProvider;
export {BackendContext};
