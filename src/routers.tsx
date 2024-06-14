import {
  createRoutesFromElements,
  createBrowserRouter,
  Route,
} from "react-router-dom";
import ErrorAlert from "./pages/error-alert";
import Dashboard from "./pages/dashboard";
import LoginPage from "./pages/login";
import Home from "./pages/home";
import Devices from "./pages/devices";
import Jobs from "./pages/jobs";

export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route
        path="/"
        element={<Home />}
        //   loader={rootLoader}
        //   action={rootAction}
        errorElement={<ErrorAlert />}
      >
        <Route errorElement={<ErrorAlert />}>
          <Route index element={<Dashboard />} />
          <Route
            path="devices"
            element={<Devices />}
            // loader={contactLoader}
            // action={contactAction}
          />
          <Route
            path="jobs"
            element={<Jobs />}
            // loader={contactLoader}
            // action={editAction}
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
