import React, { ReactNode, useState, useReducer } from 'react';

type nodeType = 'qubits' | 'resonators';
type linkType = 'couplers';
export type BackendContextState = {
	selectedNode: number;
	selectedLink: number;
	nodeType: nodeType;
	linkType: linkType;
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
	SELECT_NODE = 'SELECT_NODE',
	SELECT_LINK = 'SELECT_LINK',
	SET_NODES = 'SET_NODES',
	SET_LINKS = 'SET_LINKS',
	SET_NODE_TYPE = 'SET_NODE_TYPE',
	SET_LINK_TYPE = 'SET_LINK_TYPE'
}

export enum DateActions {
	SET_TIME_FROM = 'SET_TIME_FROM',
	SET_TIME_TO = 'SET_TIME_TO'
}

function reducer(
	state: BackendContextState,
	action:
		| { type: DateActions; payload: Date }
		| { type: MapActions; payload: number | Link[] | Point[] | nodeType | linkType }
): BackendContextState {
	switch (action.type) {
		case MapActions.SELECT_NODE:
			return { ...state, selectedNode: action.payload as number };
		case MapActions.SELECT_LINK:
			return { ...state, selectedLink: action.payload as number };
		case MapActions.SET_NODES:
			return { ...state, nodes: action.payload as Point[] };
		case MapActions.SET_LINKS:
			return {
				...state,
				links: action.payload.map((e) => {
					const from = state.nodes.find((n) => n.id == e.from);
					const to = state.nodes.find((n) => n.id == e.to);
					return {
						...e,
						from: { id: from.id, x: from.x, y: from.y },
						to: { id: to.id, x: to.x, y: to.y }
					};
				}) as Link[]
			};
		case MapActions.SET_NODE_TYPE:
			return { ...state, nodeType: action.payload as nodeType };
		case MapActions.SET_LINK_TYPE:
			return { ...state, linkType: action.payload as linkType };

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
		nodeType: 'qubits',
		linkType: 'couplers',
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
