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
	React.Dispatch<{ type: Actions; payload: number }>
];

export enum Actions {
	SELECT_NODE = 0,
	SELECT_LINK,
	SET_TIME_FROM,
	SET_TIME_TO
}

function reducer(
	state: BackendContextState,
	action: { type: Actions; payload: number | Date }
): BackendContextState {
	switch (action.type) {
		case Actions.SELECT_NODE:
			return { ...state, selectedNode: action.payload as number };
		case Actions.SELECT_LINK:
			return { ...state, selectedLink: action.payload as number };
		case Actions.SET_TIME_FROM:
			return { ...state, timeFrom: action.payload as Date };
		case Actions.SET_TIME_TO:
			return { ...state, timeTo: action.payload as Date };
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
export { BackendContext };
