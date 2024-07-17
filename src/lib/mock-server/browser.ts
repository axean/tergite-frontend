// the mock server for when running only in the browser in development mode
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const mockWorker = setupWorker(...handlers);
