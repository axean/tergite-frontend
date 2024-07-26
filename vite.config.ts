import path from "path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    include: ["src/**/__tests__/*"],
    environment: "happy-dom",
    setupFiles: "src/setupTests.ts",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    cors: {
      credentials: true,
      origin: true,
      methods: ["GET", "PUT", "POST", "DELETE", "PATCH", "HEAD"],
    },
  },
});
