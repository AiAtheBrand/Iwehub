import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Start every test with empty persisted state so tests stay independent.
beforeEach(() => {
  window.localStorage.clear();
});

// Unmount React trees between tests so assertions don't see stale DOM.
afterEach(() => {
  cleanup();
});
