import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:8080",
    viewport: { width: 1440, height: 900 },
    locale: "vi-VN",
    actionTimeout: 15_000,
  },
});
