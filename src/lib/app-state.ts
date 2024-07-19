import { createContext } from "react";
import { AppState } from "./types";

export const AppStateContext = createContext<AppState>(newAppState());

/**
 * A factory function for generating app states to ensure immutability
 *
 * @returns new app state with proper initializations
 */
export function newAppState(): AppState {
  const state: AppState = {
    currentProject: undefined,
    setCurrentProject: () => {},
    apiToken: undefined,
    setApiToken: () => {},
    clear: () => {
      state.setCurrentProject(undefined);
      state.setApiToken(undefined);
    },
  };

  return state;
}
