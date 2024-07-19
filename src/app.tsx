import { useState } from "react";
import { AppState } from "./lib/types";
import { newAppState, AppStateContext } from "./lib/app-state";
import { AppRouter } from "./router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

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
    <QueryClientProvider client={queryClient}>
      <AppStateContext.Provider value={state}>
        <AppRouter />
      </AppStateContext.Provider>
    </QueryClientProvider>
  );
}
