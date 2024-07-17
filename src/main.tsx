import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { App } from "./app";

async function startMockInDev() {
  if (
    import.meta.env.DEV &&
    import.meta.env.VITE_SHOW_MOCKS.toLowerCase() === "true"
  ) {
    // start mock server when in dev and show mock data is true
    const { mockWorker } = await import("./lib/mock-server/browser");

    // `mockWorker.start()` returns a Promise that resolves
    // once the Service Worker is up and ready to intercept requests.
    return mockWorker.start();
  }
}

startMockInDev().then(() =>
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
);
