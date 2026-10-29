import { defineConfig, devices } from "../.e2e-tools/node_modules/@playwright/test/index.mjs";

export default defineConfig({
  testDir: ".",
  testMatch: "**/real-api.spec.mjs",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { outputFolder: "playwright-report", open: "never" }]],
  outputDir: "../test-results",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    { name: "chromium-real-api", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } }
  ],
  webServer: {
    command: "pnpm start",
    url: "http://127.0.0.1:3000",
    timeout: 180000,
    reuseExistingServer: !process.env.CI,
    env: {
      NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:4000/api/v1",
      NODE_ENV: "production",
      PORT: "3000"
    }
  }
});
