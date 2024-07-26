import {
  createRoutesFromElements,
  createBrowserRouter,
  Route,
  RouterProvider,
} from "react-router-dom";
import ErrorAlert from "./pages/error-alert";
import LoginPage from "./pages/login";
import { Home, loader as homeLoader } from "./pages/home";
import { Devices, loader as devicesLoader } from "./pages/devices";
import { AppState } from "../types";
import { useContext } from "react";
import { AppStateContext } from "./lib/app-state";
import {
  Dashboard,
  loader as dashboardLoader,
  action as dashboardAction,
} from "./components/layouts/dashboard";
import {
  DeviceDetail,
  loader as deviceDetailLoader,
} from "./pages/device-detail";
import { QueryClient, useQueryClient } from "@tanstack/react-query";

export function AppRouter({ routerConstructor }: Props) {
  const appState = useContext(AppStateContext);
  const queryClient = useQueryClient();
  const router = getRoutes(appState, queryClient);
  return <RouterProvider router={routerConstructor(router)} />;
}

interface Props {
  routerConstructor: typeof createBrowserRouter;
}

/**
 * Generates a collection of routes that are aware of the app state
 *
 * @param appState - the global state of the application
 * @param queryClient - the react query client for making queries
 * @returns - the array of routes
 */
function getRoutes(appState: AppState, queryClient: QueryClient) {
  return createRoutesFromElements(
    <>
      <Route
        path="/"
        element={<Dashboard />}
        loader={dashboardLoader(appState, queryClient)}
        action={dashboardAction(appState, queryClient)}
        errorElement={<ErrorAlert className="h-screen bg-muted" />}
      >
        <Route errorElement={<ErrorAlert />}>
          <Route
            index
            element={<Home />}
            loader={homeLoader(appState, queryClient)}
          />
          <Route
            path="devices"
            element={<Devices />}
            loader={devicesLoader(appState, queryClient)}
            // action={contactAction}
          />
          <Route
            path="devices/:deviceName"
            element={<DeviceDetail />}
            loader={deviceDetailLoader(appState, queryClient)}
            // action={contactAction}
          />
        </Route>
      </Route>
      <Route
        path="login"
        element={<LoginPage />}
        //   loader={rootLoader}
        //   action={rootAction}
        errorElement={<ErrorAlert />}
      />
    </>
  );
}
