import { createRequire } from "node:module";
import { test, expect } from "../.e2e-tools/node_modules/@playwright/test/index.mjs";

const require = createRequire(new URL("../.e2e-tools/package.json", import.meta.url));
const axeModule = require("@axe-core/playwright");
const AxeBuilder = axeModule.default ?? axeModule;
const API = "http://127.0.0.1:4000/api/v1";
const CSRF = "accessibility-e2e-csrf-token-1234567890";
const USER = {
  user: { id: "aaaaaaaaaaaaaaaaaaaaaaaa", email: "accessibility-admin@example.test", role: "ADMIN" },
  csrfToken: CSRF,
  expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
};

async function installSyntheticApi(page) {
  const state = { authenticated: false };
  const corsHeaders = {
    "access-control-allow-origin": "http://127.0.0.1:3000",
    "access-control-allow-credentials": "true",
    "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "access-control-allow-headers": "Content-Type, X-CSRF-Token",
    "access-control-max-age": "600",
    vary: "Origin"
  };

  await page.route(API + "/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api/v1", "");
    const method = request.method().toUpperCase();

    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }

    const send = async (status, data, meta = {}) => {
      if (status === 204) {
        await route.fulfill({ status, headers: corsHeaders });
        return;
      }
      const body = status >= 400
        ? { error: { code: status === 401 ? "UNAUTHENTICATED" : "E2E_ERROR", message: data } }
        : { data, meta: { requestId: "accessibility-e2e", ...meta } };
      await route.fulfill({
        status,
        contentType: "application/json",
        headers: { ...corsHeaders, "cache-control": "no-store" },
        body: JSON.stringify(body)
      });
    };

    if (path === "/auth/me" && method === "GET") {
      return state.authenticated ? send(200, USER) : send(401, "Authentication required.");
    }
    if (path === "/auth/login" && method === "POST") {
      state.authenticated = true;
      return send(200, USER);
    }
    if (path === "/auth/logout" && method === "POST") {
      state.authenticated = false;
      return send(204);
    }
    if (!state.authenticated) return send(401, "Authentication required.");

    if (path === "/dashboard/summary" && method === "GET") {
      const today = new Date().toISOString().slice(0, 10);
      return send(200, {
        totals: { doctors: 0, patients: 0 },
        patientsPerDoctor: [],
        dateStatistics: {
          from: url.searchParams.get("from") ?? today,
          to: url.searchParams.get("to") ?? today,
          days: [{ date: today, doctorsCreated: 0, patientsCreated: 0 }]
        }
      });
    }
    if (path === "/doctors" && method === "GET") {
      return send(200, { doctors: [] }, { pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    }
    if (path === "/patients" && method === "GET") {
      return send(200, { patients: [] }, { pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    }
    return send(404, "No accessibility-test route matches this request.");
  });
}

async function signIn(page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  await page.getByLabel("Administrator email").fill("accessibility-admin@example.test");
  await page.getByLabel("Password").fill("accessibility-synthetic-password");
  await page.getByLabel("Password").press("Enter");
  await expect(page.getByRole("heading", { name: "Good systems make better care." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Doctor records", exact: true })
    .locator("xpath=..").locator(".metric-value > span")).toHaveText("0");
}

async function scanScreen(page, testInfo, name) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const report = {
    url: page.url(),
    viewport: page.viewportSize(),
    passedRules: result.passes.length,
    incompleteRules: result.incomplete.map(({ id, impact, help, helpUrl }) => ({ id, impact, help, helpUrl })),
    violations: result.violations.map(({ id, impact, help, helpUrl, nodes }) => ({
      id,
      impact,
      help,
      helpUrl,
      affected: nodes.map(({ target, failureSummary }) => ({ target, failureSummary }))
    }))
  };

  await testInfo.attach(name + "-axe-results.json", {
    body: Buffer.from(JSON.stringify(report, null, 2)),
    contentType: "application/json"
  });
  await page.screenshot({ path: testInfo.outputPath(name + ".png"), fullPage: true });

  const blocking = result.violations.filter(({ impact }) => impact === "critical" || impact === "serious");
  expect(blocking, JSON.stringify(blocking.map(({ id, impact, help, nodes }) => ({
    id, impact, help, targets: nodes.map(({ target }) => target)
  })), null, 2)).toEqual([]);
}

test("WCAG 2.1 A/AA scan blocks serious and critical violations on sign-in and workspace views", async ({ page }, testInfo) => {
  await installSyntheticApi(page);
  await page.setViewportSize(testInfo.project.name === "chromium-mobile" ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  await scanScreen(page, testInfo, "sign-in");

  await signIn(page);
  await scanScreen(page, testInfo, "dashboard");

  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("button", { name: /Doctors/ }).click();
  await expect(page.getByRole("heading", { name: "Care team directory" })).toBeVisible();
  await expect(page.locator(".doctor-empty-state")).toBeVisible();
  await scanScreen(page, testInfo, "doctors");

  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("button", { name: /Patients/ }).click();
  await expect(page.getByRole("heading", { name: "Patient directory" })).toBeVisible();
  await expect(page.locator(".patient-empty-state")).toBeVisible();
  await scanScreen(page, testInfo, "patients");
});

test("sign-in can be completed by keyboard without using a pointer", async ({ page }) => {
  await installSyntheticApi(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to sign-in form" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Doctor Tracker" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Administrator email")).toBeFocused();
  await page.keyboard.type("accessibility-admin@example.test");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Password")).toBeFocused();
  await page.keyboard.type("accessibility-synthetic-password");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Good systems make better care." })).toBeVisible();
});

test("reduced-motion preference removes smooth scrolling and reduces transition duration", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await installSyntheticApi(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();

  const motion = await page.evaluate(() => ({
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    transitionDurations: getComputedStyle(document.querySelector(".skip-link")).transitionDuration
      .split(",")
      .map((raw) => {
        const value = raw.trim();
        const amount = Number.parseFloat(value);
        return value.endsWith("ms") ? amount : amount * 1000;
      })
  }));
  expect(motion.scrollBehavior).toBe("auto");
  expect(motion.transitionDurations.length).toBeGreaterThan(0);
  expect(motion.transitionDurations.every((milliseconds) => milliseconds <= 0.1), JSON.stringify(motion)).toBe(true);
});

test("mobile navigation is keyboard operable and restores focus after Escape", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-mobile", "Mobile-only navigation behavior.");
  await installSyntheticApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);

  const menuButton = page.getByRole("button", { name: "Open navigation" });
  await menuButton.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Close navigation" })).toBeVisible();
  await expect(page.locator("#primary-sidebar .nav-link").first()).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Open navigation" })).toHaveAttribute("aria-expanded", "false");
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeFocused();
});
