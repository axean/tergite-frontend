import { useState } from "react";
import { AppState } from "./lib/types";
import { newAppState, AppStateContext } from "./lib/app-state";
import { AppRouter } from "./router";

export function App() {
  const [currentProject, setCurrentProject] = useState<string>();
  const [apiToken, setApiToken] = useState<string>();
  const state: AppState = {
    ...newAppState(),
    apiToken,
    setApiToken,
    currentProject,
    setCurrentProject,
  };

  return (
    <AppStateContext.Provider value={state}>
      <AppRouter />
    </AppStateContext.Provider>
  );
}
