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

export function AppRouter() {
  const appState = useContext(AppStateContext);
  const router = getRouter(appState);
  return <RouterProvider router={router} />;
}

/**
 * Generates a router component that is aware of the app state
 *
 * @param appState - the global state of the application
 * @returns - the router which is aware of the app state
 */
function getRouter(appState: AppState) {
  return createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route
          path="/"
          element={<Dashboard />}
          loader={dashboardLoader(appState)}
          errorElement={<ErrorAlert />}
        >
          <Route errorElement={<ErrorAlert />}>
            <Route index element={<Home />} loader={homeLoader(appState)} />
            <Route
              path="devices"
              element={<Devices />}
              loader={devicesLoader(appState)}
              // action={contactAction}
            />
            <Route
              path="devices/:deviceName"
              element={<DeviceDetail />}
              loader={deviceDetailLoader(appState)}
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
