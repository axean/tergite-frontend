import { defineConfig } from "cypress";
import dotenv from "dotenv";
import getCompareSnapshotsPlugin from "cypress-image-diff-js/plugin";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      dotenv.config({ path: ".env.test" });
      config.env = { ...config.env, ...process.env };
      config.env["PLATFORM"] = process.platform;
      // implement node event listeners here
      return getCompareSnapshotsPlugin(on, config);
    },
    baseUrl: "http://127.0.0.1:5173/",
    // set the viewports for the sake of cypress.visual-image-diff plugin
    // https://cypress.visual-image-diff.dev/getting-started#force-resolution-size
    viewportWidth: 1280,
    viewportHeight: 750
  },
});
