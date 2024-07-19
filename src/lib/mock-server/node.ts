// the mock server for when running only in the nodejs e.g. in test mode
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const mockServer = setupServer(...handlers);
