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
import { AppState } from "./lib/types";
import { useContext } from "react";
import { AppStateContext } from "./lib/app-state";
import {
  Dashboard,
  loader as dashboardLoader,
} from "./components/layouts/dashboard";
import {
  DeviceDetail,
  loader as deviceDetailLoader,
} from "./pages/device-detail";
import { QueryClient, useQueryClient } from "@tanstack/react-query";

export function AppRouter() {
  const appState = useContext(AppStateContext);
  const queryClient = useQueryClient();
  const router = getRouter(appState, queryClient);
  return <RouterProvider router={router} />;
}

/**
 * Generates a router component that is aware of the app state
 *
 * @param appState - the global state of the application
 * @param queryClient - the react query client for making queries
 * @returns - the router which is aware of the app state
 */
function getRouter(appState: AppState, queryClient: QueryClient) {
  return createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route
          path="/"
          element={<Dashboard />}
          loader={dashboardLoader(appState, queryClient)}
          errorElement={<ErrorAlert />}
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
    )
  );
}
