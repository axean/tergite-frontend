import React, { ReactNode, useState, useReducer } from 'react';

type BackendContextState = {
	selectedNode: number;
	selectedLink: number;
	nodes: Point[];
	links: Link[];
};

type BackendContextProps = [
	BackendContextState,
	React.Dispatch<{ type: Actions; payload: number }>
];

enum Actions {
	SELECT_NODE = 0,
	SELECT_LINK
}

function reducer(state: BackendContextState, action: { type: Actions; payload: number }) {
	switch (action.type) {
		case Actions.SELECT_NODE:
			return { ...state, selectedNode: action.payload };
		case Actions.SELECT_LINK:
			return { ...state, selectedLink: action.payload };
	}
}
const BackendContext = React.createContext<BackendContextProps>(null);

type BackendContextProviderProps = {
	children: ReactNode;
};
const BackendContextProvider: React.FC<BackendContextProviderProps> = ({ children }) => {
	const data = {
		selectedNode: -1,
		selectedLink: -1,
		nodes: [],
		links: []
	};
	const x = useReducer(reducer, data);
	return <BackendContext.Provider value={x}>{children}</BackendContext.Provider>;
};
export default BackendContextProvider;
