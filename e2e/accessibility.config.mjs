import { defineConfig, devices } from "../.e2e-tools/node_modules/@playwright/test/index.mjs";

export default defineConfig({
  testDir: ".",
  testMatch: "accessibility.spec.mjs",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { outputFolder: "accessibility-report", open: "never" }]],
  outputDir: "../test-results",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    { name: "chromium-desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } } },
    { name: "chromium-mobile", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } }
  ],
  webServer: {
    command: "pnpm build && pnpm start",
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
