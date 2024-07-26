import { useState } from "react";
import { AppState } from "../types";
import { newAppState, AppStateContext } from "./lib/app-state";
import { AppRouter } from "./router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter } from "react-router-dom";

const queryClient = new QueryClient();

export function App({ routerConstructor = createBrowserRouter }: Props) {
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
        <AppRouter routerConstructor={routerConstructor} />
      </AppStateContext.Provider>
    </QueryClientProvider>
  );
}

interface Props {
  routerConstructor?: typeof createBrowserRouter;
}
