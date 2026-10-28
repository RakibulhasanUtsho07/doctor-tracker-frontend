import { defineConfig, devices } from "../.e2e-tools/node_modules/@playwright/test/index.mjs";

const baseURL = process.env.STAGING_FRONTEND_URL;

if (!baseURL) {
  throw new Error("STAGING_FRONTEND_URL must be supplied by the staging smoke workflow.");
}

export default defineConfig({
  testDir: ".",
  testMatch: "**/staging-smoke.spec.mjs",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "staging-smoke-report", open: "never" }]],
  outputDir: "../test-results-staging-smoke",
  use: {
    baseURL,
    trace: "off",
    screenshot: "only-on-failure",
    video: "off",
    ignoreHTTPSErrors: false,
    viewport: { width: 1440, height: 1000 }
  },
  projects: [
    {
      name: "chromium-staging",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } }
    }
  ]
});
