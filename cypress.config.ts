import { defineConfig } from "cypress";
import dotenv from "dotenv";

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      dotenv.config({ path: ".env.test" });
      config.env = { ...config.env, ...process.env };
      // implement node event listeners here
      return config;
    },
    baseUrl: "http://127.0.0.1:5173/",
  },
});
