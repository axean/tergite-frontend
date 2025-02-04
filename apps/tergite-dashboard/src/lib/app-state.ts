import { createContext } from "react";
import { AppState } from "../../types";

export const AppStateContext = createContext<AppState>(newAppState());

/**
 * A factory function for generating app states to ensure immutability
 *
 * @returns new app state with proper initializations
 */
export function newAppState(): AppState {
  const state: AppState = {
    currentProjectExtId: undefined,
    setCurrentProjectExtId: () => {},
    apiToken: undefined,
    isDark: false,
    setApiToken: () => {},
    toggleIsDark: () => {},
    clear: () => {
      state.setCurrentProjectExtId(undefined);
      state.setApiToken(undefined);
    },
  };

  return state;
}
