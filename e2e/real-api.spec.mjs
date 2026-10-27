import { randomUUID } from "node:crypto";
import { test, expect, request } from "../.e2e-tools/node_modules/@playwright/test/index.mjs";

const API = "http://127.0.0.1:4000/api/v1";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "real-api-e2e@example.test";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

async function signIn(page, password = ADMIN_PASSWORD) {
  if (!password) throw new Error("E2E_ADMIN_PASSWORD must be provided by the real API test environment.");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  await page.getByLabel("Administrator email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /Sign in securely/ }).click();
  await expect(page.getByRole("heading", { name: "Your practice, in focus" })).toBeVisible();
}

function dashboardMetric(page, title) {
  return page.getByRole("heading", { name: title, exact: true })
    .locator("xpath=..")
    .locator(".metric-value > span");
}

test("real API rejects invalid credentials without persisting a browser session", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Administrator email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill("definitely-not-the-CI-password");
  await page.getByRole("button", { name: /Sign in securely/ }).click();

  await expect(page.locator("#login-error")).toHaveText("Email or password is incorrect.");
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();

  const storedKeys = await page.evaluate(() => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage)
  }));
  expect(storedKeys.local).toEqual([]);
  expect(storedKeys.session).toEqual([]);
  expect((await page.context().cookies(API)).some((cookie) => cookie.name === "dt_session")).toBe(false);

  const untrusted = await request.newContext();
  try {
    const denied = await untrusted.get(`${API}/health`, {
      headers: { Origin: "https://not-allowed.invalid" }
    });
    expect(denied.status()).toBe(403);
  } finally {
    await untrusted.dispose();
  }
});

test("real API browser journey verifies cookie CORS, CSRF, persisted patient lifecycle, dashboard and session revocation", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const suffix = randomUUID().slice(0, 8);
  const doctorName = `Dr. Real API ${suffix}`;
  const doctorEmail = `doctor-${suffix}@example.test`;
  const preservedName = `Real API Patient Preserve ${suffix}`;
  const deletedName = `Real API Patient Delete ${suffix}`;
  const mutationRequests = [];
  const preflightResponses = [];

  page.on("request", (req) => {
    if (!req.url().startsWith(API + "/")) return;
    if (["POST", "PATCH", "DELETE"].includes(req.method())) {
      mutationRequests.push({ method: req.method(), url: req.url(), headers: req.headers() });
    }
  });
  page.on("response", async (res) => {
    if (!res.url().startsWith(API + "/") || res.request().method() !== "OPTIONS") return;
    preflightResponses.push({ url: res.url(), status: res.status(), headers: await res.allHeaders() });
  });

  await page.setViewportSize({ width: 1440, height: 1000 });
  await signIn(page);

  const cookieBeforeLogout = (await page.context().cookies(API)).find((cookie) => cookie.name === "dt_session");
  expect(cookieBeforeLogout).toBeDefined();
  expect(cookieBeforeLogout.httpOnly).toBe(true);
  expect(cookieBeforeLogout.sameSite).toBe("Strict");

  // This real cross-origin JSON write intentionally omits X-CSRF-Token.
  // The browser must complete CORS preflight, then the API must reject the write.
  const noCsrf = await page.evaluate(async ({ api, suffix: id }) => {
    const response = await fetch(api + "/doctors", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Must Not Persist " + id,
        specialization: "Cardiology",
        hospital: "CI Test Hospital",
        phone: "+880 1700-100001",
        email: "no-csrf-" + id + "@example.test"
      })
    });
    const body = await response.json();
    return { status: response.status, code: body?.error?.code };
  }, { api: API, suffix });
  expect(noCsrf).toEqual({ status: 403, code: "CSRF_VALIDATION_FAILED" });
  await expect.poll(() => preflightResponses.some((response) => response.url.endsWith("/doctors"))).toBe(true);
  const corsPreflight = preflightResponses.find((response) => response.url.endsWith("/doctors"));
  expect(corsPreflight.status).toBe(204);
  expect(corsPreflight.headers["access-control-allow-origin"]).toBe("http://127.0.0.1:3000");
  expect(corsPreflight.headers["access-control-allow-credentials"]).toBe("true");
  expect(corsPreflight.headers["access-control-allow-headers"]).toMatch(/X-CSRF-Token/i);

  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("button", { name: /Doctors/ }).click();
  await expect(page.getByRole("heading", { name: "Care team directory" })).toBeVisible();
  await page.getByRole("button", { name: /Add doctor/ }).click();
  const doctorForm = page.locator(".doctor-editor form");
  await doctorForm.getByLabel(/Full name/).fill(doctorName);
  await doctorForm.getByLabel(/^Specialization/).fill("Cardiology");
  await doctorForm.getByLabel(/Hospital \/ clinic/).fill("Real API E2E Hospital");
  await doctorForm.getByLabel(/^Phone/).fill("+880 1700-100001");
  await doctorForm.getByLabel(/^Email address/).fill(doctorEmail);
  await doctorForm.getByRole("button", { name: "Create doctor" }).click();

  await expect(page.getByRole("heading", { name: doctorName })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Associated patients/ })).toBeVisible();
  await page.getByRole("button", { name: /Add patient/ }).click();
  await expect(page.getByRole("heading", { name: "Add a patient" })).toBeVisible();
  const doctorId = await page.getByLabel(/Doctor association/).inputValue();
  expect(doctorId).toMatch(/^[a-f\d]{24}$/i);
  await page.getByLabel(/Patient name/).fill(preservedName);
  await page.locator(".patient-editor form").getByLabel(/^Condition/).fill("Routine follow-up");
  await page.getByRole("button", { name: "Create patient" }).click();
  await expect(page.getByRole("heading", { name: preservedName })).toBeVisible();

  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("button", { name: /Doctors/ }).click();
  await page.locator(".doctor-table").getByRole("button", { name: doctorName, exact: true }).click();
  await expect(page.getByText(preservedName)).toBeVisible();
  await page.getByRole("button", { name: "View all" }).click();
  await expect(page.getByRole("heading", { name: "Patient directory" })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: preservedName })).toBeVisible();
  await page.getByRole("button", { name: "Reset" }).click();
  await page.getByRole("button", { name: preservedName, exact: true }).click();
  await page.getByRole("button", { name: "Edit details" }).click();
  await page.locator(".patient-editor form").getByLabel(/^Condition/).fill("Routine follow-up updated");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("heading", { name: preservedName })).toBeVisible();

  await page.getByLabel("Search patients").fill(preservedName);
  await page.getByLabel("Condition (exact)").fill("Routine follow-up updated");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByRole("row").filter({ hasText: preservedName })).toBeVisible();
  await page.getByRole("button", { name: "Reset" }).click();

  await page.getByRole("button", { name: "Detach from doctor" }).click();
  const detachDialog = page.getByRole("dialog", { name: "Detach this patient from the doctor?" });
  await expect(detachDialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(detachDialog).toBeHidden();
  await page.getByRole("button", { name: "Detach from doctor" }).click();
  await page.getByRole("dialog", { name: "Detach this patient from the doctor?" })
    .getByRole("button", { name: "Detach and preserve" }).click();
  const preservedRow = page.getByRole("row").filter({ hasText: preservedName });
  await expect(preservedRow).toBeVisible();
  await expect(preservedRow.getByText("Unassigned")).toBeVisible();

  await page.getByRole("button", { name: /Add patient/ }).click();
  await expect(page.getByRole("heading", { name: "Add a patient" })).toBeVisible();
  await page.getByLabel(/Patient name/).fill(deletedName);
  await page.getByLabel(/Doctor association/).selectOption(doctorId);
  await page.locator(".patient-editor form").getByLabel(/^Condition/).fill("Disposable CI record");
  await page.getByRole("button", { name: "Create patient" }).click();
  await expect(page.getByRole("heading", { name: deletedName })).toBeVisible();
  await page.getByRole("button", { name: "Delete patient record" }).click();
  const deleteDialog = page.getByRole("dialog", { name: "Delete this patient record?" });
  await expect(deleteDialog).toBeVisible();
  await deleteDialog.getByRole("button", { name: "Delete permanently" }).click();
  await expect(page.getByRole("button", { name: deletedName, exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: preservedName, exact: true })).toBeVisible();

  // Reload makes the UI re-read the actual MongoDB-backed API, not browser-local test state.
  await page.reload();
  await expect(page.getByRole("heading", { name: "Your practice, in focus" })).toBeVisible();
  await expect(dashboardMetric(page, "Doctor records")).toHaveText("1");
  await expect(dashboardMetric(page, "Patient records")).toHaveText("1");
  await page.screenshot({ path: testInfo.outputPath("real-api-dashboard-desktop.png"), fullPage: true });

  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("button", { name: /Patients/ }).click();
  await expect(page.getByRole("heading", { name: "Patient directory" })).toBeVisible();
  const persistence = await page.evaluate(async ({ api, preserved, deleted }) => {
    async function query(name) {
      const url = new URL(api + "/patients");
      url.searchParams.set("search", name);
      url.searchParams.set("limit", "10");
      const response = await fetch(url.toString(), { credentials: "include" });
      const body = await response.json();
      return {
        status: response.status,
        total: body?.meta?.pagination?.total,
        patients: body?.data?.patients ?? []
      };
    }
    return { preserved: await query(preserved), deleted: await query(deleted) };
  }, { api: API, preserved: preservedName, deleted: deletedName });
  expect(persistence.preserved.status).toBe(200);
  expect(persistence.preserved.total).toBe(1);
  expect(persistence.preserved.patients[0].doctorId).toBeNull();
  expect(persistence.preserved.patients[0].condition).toBe("Routine follow-up updated");
  expect(persistence.deleted.status).toBe(200);
  expect(persistence.deleted.total).toBe(0);

  await page.screenshot({ path: testInfo.outputPath("real-api-patients-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: testInfo.outputPath("real-api-patients-mobile.png"), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });

  expect(mutationRequests.some((entry) => entry.method === "POST" && entry.url.endsWith("/doctors") && Boolean(entry.headers["x-csrf-token"]))).toBe(true);
  expect(mutationRequests.some((entry) => entry.method === "POST" && entry.url.endsWith("/patients") && Boolean(entry.headers["x-csrf-token"]))).toBe(true);
  expect(mutationRequests.some((entry) => entry.method === "PATCH" && entry.url.includes("/patients/") && Boolean(entry.headers["x-csrf-token"]))).toBe(true);
  expect(mutationRequests.some((entry) => entry.method === "DELETE" && entry.url.includes("/doctors/") && entry.url.includes("/patients/") && Boolean(entry.headers["x-csrf-token"]))).toBe(true);
  expect(mutationRequests.some((entry) => entry.method === "DELETE" && entry.url.includes("/patients/") && Boolean(entry.headers["x-csrf-token"]))).toBe(true);

  const originalCookieValue = cookieBeforeLogout.value;
  await page.getByRole("button", { name: "Sign out of the administrator session" }).click();
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  const storedKeys = await page.evaluate(() => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage)
  }));
  expect(storedKeys.local).toEqual([]);
  expect(storedKeys.session).toEqual([]);
  expect((await page.context().cookies(API)).some((cookie) => cookie.name === "dt_session")).toBe(false);

  const staleSessionProbe = await request.newContext();
  try {
    const revoked = await staleSessionProbe.get(API + "/auth/me", {
      headers: { Cookie: "dt_session=" + originalCookieValue }
    });
    expect(revoked.status()).toBe(401);
  } finally {
    await staleSessionProbe.dispose();
  }
});
