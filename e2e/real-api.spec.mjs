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

test("real API enforces patient list query and pagination boundaries", async ({ page }) => {
  await signIn(page);

  const results = await page.evaluate(async (api) => {
    const invalidQueries = {
      zeroPage: "page=0",
      zeroLimit: "limit=0",
      excessiveLimit: "limit=101",
      duplicateLimit: "limit=1&limit=2",
      offsetTooLarge: "page=100000&limit=2",
      unknownParameter: "unexpected=1",
      invalidCalendarDate: "from=2026-02-30",
      reversedDateRange: "from=2026-03-02&to=2026-03-01",
      whitespaceSearch: "search=%20"
    };

    const invalidResults = {};
    for (const [name, query] of Object.entries(invalidQueries)) {
      const response = await fetch(api + "/patients?" + query, { credentials: "include" });
      const body = await response.json();
      invalidResults[name] = { status: response.status, code: body?.error?.code };
    }

    const validResponse = await fetch(api + "/patients?page=1&limit=1", {
      credentials: "include"
    });
    const validBody = await validResponse.json();
    const emptySearch = "__no_patient_match_" + Date.now() + "_" + Math.random().toString(16).slice(2);
    const emptyResponse = await fetch(api + "/patients?search=" + encodeURIComponent(emptySearch) + "&page=2&limit=10", {
      credentials: "include"
    });
    const emptyBody = await emptyResponse.json();
    return {
      invalidResults,
      emptyPage: {
        status: emptyResponse.status,
        page: emptyBody?.meta?.pagination?.page,
        limit: emptyBody?.meta?.pagination?.limit,
        total: emptyBody?.meta?.pagination?.total,
        totalPages: emptyBody?.meta?.pagination?.totalPages,
        rowCount: emptyBody?.data?.patients?.length
      },
      valid: {
        status: validResponse.status,
        page: validBody?.meta?.pagination?.page,
        limit: validBody?.meta?.pagination?.limit,
        total: validBody?.meta?.pagination?.total,
        totalPages: validBody?.meta?.pagination?.totalPages,
        rowCount: validBody?.data?.patients?.length
      }
    };
  }, API);

  for (const [name, result] of Object.entries(results.invalidResults)) {
    expect(result, name).toEqual({ status: 400, code: "VALIDATION_ERROR" });
  }

  expect(results.emptyPage.status).toBe(200);
  expect(results.emptyPage.page).toBe(2);
  expect(results.emptyPage.limit).toBe(10);
  expect(results.emptyPage.total).toBe(0);
  expect(results.emptyPage.totalPages).toBe(0);
  expect(results.emptyPage.rowCount).toBe(0);

  expect(results.valid.status).toBe(200);
  expect(results.valid.page).toBe(1);
  expect(results.valid.limit).toBe(1);
  expect(results.valid.total).toBeGreaterThanOrEqual(0);
  expect(results.valid.totalPages).toBe(Math.ceil(results.valid.total / results.valid.limit));
  expect(results.valid.rowCount).toBeLessThanOrEqual(1);
});

test("real API browser journey verifies cookie CORS, CSRF, persisted patient lifecycle, dashboard and session revocation", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const suffix = randomUUID().slice(0, 8);
  const doctorName = `Dr. Real API ${suffix}`;
  const doctorEmail = `doctor-${suffix}@example.test`;
  const preservedName = `Real API Patient Preserve ${suffix}`;
  const deletedName = `Real API Patient Delete ${suffix}`;
  const mutationRequests = [];

  page.on("request", (req) => {
    if (!req.url().startsWith(API + "/")) return;
    if (["POST", "PATCH", "DELETE"].includes(req.method())) {
      mutationRequests.push({ method: req.method(), url: req.url(), headers: req.headers() });
    }
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
  // Probe the API's actual CORS preflight contract explicitly. The browser's
  // successful cross-origin login and mutation requests below provide the
  // browser-level credential/cookie check; Chromium does not consistently
  // surface internal preflight requests as page response events.
  const corsProbe = await request.newContext();
  try {
    const corsPreflight = await corsProbe.fetch(API + "/doctors", {
      method: "OPTIONS",
      headers: {
        Origin: "http://127.0.0.1:3000",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type,x-csrf-token"
      }
    });
    expect(corsPreflight.status()).toBe(204);
    const corsHeaders = corsPreflight.headers();
    expect(corsHeaders["access-control-allow-origin"]).toBe("http://127.0.0.1:3000");
    expect(corsHeaders["access-control-allow-credentials"]).toBe("true");
    expect(corsHeaders["access-control-allow-headers"]).toMatch(/X-CSRF-Token/i);
  } finally {
    await corsProbe.dispose();
  }

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

test("real UI reassigns a patient and paginates persisted records", async ({ page }) => {
  test.setTimeout(180_000);
  const suffix = randomUUID().slice(0, 8);
  const destinationDoctorName = "Dr. Pagination Destination " + suffix;
  const destinationDoctorEmail = "pagination-destination-" + suffix + "@example.test";
  const patientNames = Array.from({ length: 11 }, (_, index) =>
    "Pagination Patient " + suffix + " " + String(index + 1).padStart(2, "0")
  );
  const oldestPatientName = patientNames[0];

  await signIn(page);

  const sourceDoctor = await page.evaluate(async (api) => {
    const response = await fetch(api + "/doctors?page=1&limit=100", { credentials: "include" });
    const body = await response.json();
    if (!response.ok) throw new Error("Could not load an existing doctor for the reassignment journey.");
    const doctor = body?.data?.doctors?.[0];
    if (!doctor?.id || !doctor?.name) throw new Error("The integration database needs an existing source doctor.");
    return { id: doctor.id, name: doctor.name };
  }, API);

  await page.getByRole("navigation", { name: "Primary navigation" })
    .getByRole("button", { name: /Doctors/ }).click();
  await expect(page.getByRole("heading", { name: "Care team directory" })).toBeVisible();
  await page.getByRole("button", { name: /Add doctor/ }).click();
  const doctorForm = page.locator(".doctor-editor form");
  await doctorForm.getByLabel(/Full name/).fill(destinationDoctorName);
  await doctorForm.getByLabel(/^Specialization/).fill("Family Medicine");
  await doctorForm.getByLabel(/Hospital \/ clinic/).fill("Pagination E2E Clinic");
  await doctorForm.getByLabel(/^Phone/).fill("+880 1700-100002");
  await doctorForm.getByLabel(/^Email address/).fill(destinationDoctorEmail);
  const doctorCreated = page.waitForResponse((response) =>
    response.url() === API + "/doctors" && response.request().method() === "POST"
  );
  await doctorForm.getByRole("button", { name: "Create doctor" }).click();
  const doctorResponse = await doctorCreated;
  expect(doctorResponse.status()).toBe(201);
  const doctorBody = await doctorResponse.json();
  const destinationDoctorId = doctorBody?.data?.doctor?.id;
  expect(destinationDoctorId).toMatch(/^[a-f\d]{24}$/i);
  await expect(page.getByRole("heading", { name: destinationDoctorName })).toBeVisible();

  await page.getByRole("navigation", { name: "Primary navigation" })
    .getByRole("button", { name: /Patients/ }).click();
  await expect(page.getByRole("heading", { name: "Patient directory" })).toBeVisible();

  for (const patientName of patientNames) {
    await page.getByRole("button", { name: /Add patient/ }).click();
    await expect(page.getByRole("heading", { name: "Add a patient" })).toBeVisible();
    await page.getByLabel(/Patient name/).fill(patientName);
    await page.getByLabel(/Doctor association/).selectOption(sourceDoctor.id);
    await page.locator(".patient-editor form").getByLabel(/^Condition/).fill("Pagination acceptance " + suffix);
    const patientCreated = page.waitForResponse((response) =>
      response.url() === API + "/patients" && response.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Create patient" }).click();
    const patientResponse = await patientCreated;
    expect(patientResponse.status(), patientName).toBe(201);
    await expect(page.getByRole("heading", { name: patientName })).toBeVisible();
  }

  await page.getByLabel("Condition (exact)").fill("Pagination acceptance " + suffix);
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.locator(".patient-total-count")).toHaveText("11");
  await expect(page.getByText(/^Page 1 of 1$/)).toBeVisible();

  await page.getByLabel("Rows per page").selectOption("10");
  await expect(page.getByText(/^Page 1 of 2$/)).toBeVisible();
  await expect(page.locator(".patient-table tbody").getByRole("button", {
    name: oldestPatientName, exact: true
  })).toHaveCount(0);

  await page.getByLabel("Rows per page").selectOption("50");
  await expect(page.getByText(/^Page 1 of 1$/)).toBeVisible();
  await expect(page.locator(".patient-table tbody").getByRole("button", {
    name: oldestPatientName, exact: true
  })).toBeVisible();

  await page.getByLabel("Rows per page").selectOption("10");
  await expect(page.getByText(/^Page 1 of 2$/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Next page" })).toBeEnabled();

  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByText(/^Page 2 of 2$/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Previous page" })).toBeEnabled();
  await expect(page.locator(".patient-table tbody").getByRole("button", {
    name: oldestPatientName, exact: true
  })).toBeVisible();

  await page.locator(".patient-table tbody").getByRole("button", {
    name: oldestPatientName, exact: true
  }).click();
  await expect(page.getByRole("heading", { name: oldestPatientName })).toBeVisible();
  await page.getByRole("button", { name: "Edit details" }).click();
  await expect(page.getByRole("heading", { name: "Update patient details" })).toBeVisible();
  await page.getByLabel(/Doctor association/).selectOption(destinationDoctorId);
  const patientUpdated = page.waitForResponse((response) =>
    response.url().startsWith(API + "/patients/") && response.request().method() === "PATCH"
  );
  await page.getByRole("button", { name: "Save changes" }).click();
  const updateResponse = await patientUpdated;
  expect(updateResponse.status()).toBe(200);
  await expect(page.locator(".patient-detail-grid").getByText(destinationDoctorName, { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "Your practice, in focus" })).toBeVisible();
  await page.getByRole("navigation", { name: "Primary navigation" })
    .getByRole("button", { name: /Patients/ }).click();
  await expect(page.getByRole("heading", { name: "Patient directory" })).toBeVisible();
  await page.getByLabel("Search patients").fill(oldestPatientName);
  await page.getByRole("button", { name: "Apply filters" }).click();
  const reassignedRow = page.getByRole("row").filter({ hasText: oldestPatientName });
  await expect(reassignedRow).toBeVisible();
  await expect(reassignedRow.getByText(destinationDoctorName, { exact: true })).toBeVisible();

  const persisted = await page.evaluate(async ({ api, name }) => {
    const url = new URL(api + "/patients");
    url.searchParams.set("search", name);
    url.searchParams.set("page", "1");
    url.searchParams.set("limit", "10");
    const response = await fetch(url.toString(), { credentials: "include" });
    const body = await response.json();
    return {
      status: response.status,
      patients: body?.data?.patients ?? [],
      pagination: body?.meta?.pagination
    };
  }, { api: API, name: oldestPatientName });
  expect(persisted.status).toBe(200);
  expect(persisted.pagination.total).toBe(1);
  expect(persisted.patients).toHaveLength(1);
  expect(persisted.patients[0].name).toBe(oldestPatientName);
  expect(persisted.patients[0].doctorId).toBe(destinationDoctorId);

  // A filter submitted while on page 2 must reset the displayed page and count.
  await page.getByLabel("Rows per page").selectOption("10");
  await expect(page.getByText(/^Page 1 of 2$/)).toBeVisible();
  await page.getByRole("button", { name: "Next page" }).click();
  await expect(page.getByText(/^Page 2 of 2$/)).toBeVisible();
  await page.getByLabel("Search patients").fill(oldestPatientName);
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByText(/^Page 1 of 1$/)).toBeVisible();
  await expect(page.locator(".patient-table tbody").getByRole("button", {
    name: oldestPatientName, exact: true
  })).toBeVisible();
});

test("real UI finds a doctor beyond the first 100 and persists patient reassignment", async ({ page }) => {
  test.setTimeout(180_000);
  const suffix = randomUUID().slice(0, 8);
  const patientName = "Boundary Search Patient " + suffix;
  await signIn(page);

  const boundary = await page.evaluate(async ({ api, suffix }) => {
    const meResponse = await fetch(api + "/auth/me", { credentials: "include" });
    const meBody = await meResponse.json();
    const csrfToken = meBody?.data?.csrfToken;
    if (!meResponse.ok || typeof csrfToken !== "string" || csrfToken.length < 40) {
      throw new Error("Could not obtain the active test session's in-memory CSRF token.");
    }

    const created = [];
    for (let start = 0; start < 105; start += 15) {
      const batch = Array.from({ length: Math.min(15, 105 - start) }, (_, offset) => start + offset);
      const results = await Promise.all(batch.map(async (index) => {
        const name = "Dr. Beyond First Page " + suffix + " " + String(index).padStart(3, "0");
        const response = await fetch(api + "/doctors", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
          body: JSON.stringify({
            name,
            specialization: "Family Medicine",
            hospital: "Boundary Acceptance Clinic",
            phone: "+880 1700 200000",
            email: "beyond-" + suffix + "-" + String(index).padStart(3, "0") + "@example.test"
          })
        });
        const body = await response.json();
        if (response.status !== 201 || !body?.data?.doctor?.id) {
          throw new Error("Could not create the synthetic doctor boundary fixture at index " + index + ": " + response.status);
        }
        return { id: body.data.doctor.id, name };
      }));
      created.push(...results);
    }

    const firstResponse = await fetch(api + "/doctors?page=1&limit=100", { credentials: "include" });
    const firstBody = await firstResponse.json();
    const secondResponse = await fetch(api + "/doctors?page=2&limit=100", { credentials: "include" });
    const secondBody = await secondResponse.json();
    const firstPage = firstBody?.data?.doctors ?? [];
    const secondPage = secondBody?.data?.doctors ?? [];
    const target = created[0];
    if (firstResponse.status !== 200 || secondResponse.status !== 200 ||
        firstPage.length !== 100 || firstPage.some((doctor) => doctor.id === target.id) ||
        !secondPage.some((doctor) => doctor.id === target.id)) {
      throw new Error("The boundary fixture did not place its target beyond doctor page 1.");
    }
    return { target, source: firstPage[0], firstPageCount: firstPage.length, targetOnSecondPage: secondPage.some((doctor) => doctor.id === target.id) };
  }, { api: API, suffix });

  expect(boundary.firstPageCount).toBe(100);
  expect(boundary.targetOnSecondPage).toBe(true);
  expect(boundary.target.id).not.toBe(boundary.source.id);

  await page.getByRole("navigation", { name: "Primary navigation" })
    .getByRole("button", { name: /Patients/ }).click();
  await expect(page.getByRole("heading", { name: "Patient directory" })).toBeVisible();
  await page.getByRole("button", { name: /Add patient/ }).click();
  await expect(page.getByRole("heading", { name: "Add a patient" })).toBeVisible();
  await page.getByLabel(/Patient name/).fill(patientName);
  await page.getByLabel(/Doctor association/).selectOption(boundary.source.id);
  await page.locator(".patient-editor form").getByLabel(/^Condition/).fill("Doctor boundary acceptance " + suffix);
  const createResponsePromise = page.waitForResponse((response) =>
    response.url() === API + "/patients" && response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Create patient" }).click();
  const createResponse = await createResponsePromise;
  expect(createResponse.status()).toBe(201);
  await expect(page.getByRole("heading", { name: patientName })).toBeVisible();

  await page.getByLabel(/Find doctors/).fill(boundary.target.name);
  await expect(page.locator(".patient-doctor-lookup-status")).toContainText("1 doctor match found");
  await page.getByRole("button", { name: "Edit details" }).click();
  await expect(page.getByRole("heading", { name: "Update patient details" })).toBeVisible();
  await page.getByLabel(/Doctor association/).selectOption(boundary.target.id);
  const patchPromise = page.waitForResponse((response) =>
    response.url().startsWith(API + "/patients/") && response.request().method() === "PATCH"
  );
  await page.getByRole("button", { name: "Save changes" }).click();
  const patchResponse = await patchPromise;
  expect(patchResponse.status()).toBe(200);
  await expect(page.locator(".patient-detail-heading")).toContainText(boundary.target.name);

  await page.reload();
  await expect(page.getByRole("heading", { name: "Your practice, in focus" })).toBeVisible();
  await page.getByRole("navigation", { name: "Primary navigation" })
    .getByRole("button", { name: /Patients/ }).click();
  await expect(page.getByRole("heading", { name: "Patient directory" })).toBeVisible();
  const persisted = await page.evaluate(async ({ api, name }) => {
    const url = new URL(api + "/patients");
    url.searchParams.set("search", name);
    url.searchParams.set("page", "1");
    url.searchParams.set("limit", "10");
    const response = await fetch(url.toString(), { credentials: "include" });
    const body = await response.json();
    return {
      status: response.status,
      total: body?.meta?.pagination?.total,
      patient: body?.data?.patients?.[0] ?? null
    };
  }, { api: API, name: patientName });
  expect(persisted.status).toBe(200);
  expect(persisted.total).toBe(1);
  expect(persisted.patient?.name).toBe(patientName);
  expect(persisted.patient?.doctorId).toBe(boundary.target.id);
});
