import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";
import { mockServer } from "./lib/mock-server/node";

expect.extend(matchers);

afterEach(() => {
  cleanup();
  // reset any one-time request handlers defined within our tests
  mockServer.resetHandlers();
});

beforeAll(() => mockServer.listen());

afterAll(() => mockServer.close());
