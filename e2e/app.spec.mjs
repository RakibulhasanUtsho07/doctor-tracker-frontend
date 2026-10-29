import { test, expect } from "../.e2e-tools/node_modules/@playwright/test/index.mjs";

const API = "http://127.0.0.1:4000/api/v1";
const DOCTOR_ID = "111111111111111111111111";
const PATIENT_ONE_ID = "222222222222222222222222";
const PATIENT_TWO_ID = "333333333333333333333333";
const CSRF = "synthetic-e2e-csrf-token-12345678901234567890";

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function doctorRecord(overrides = {}) {
  const now = new Date().toISOString();
  return {
    id: DOCTOR_ID,
    name: "Dr. Amina Rahman",
    specialization: "Cardiology",
    hospital: "Synthetic City Hospital",
    phone: "+880 1700-000001",
    email: "amina@example.test",
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function patientRecord(id, name, doctorId, condition) {
  const now = new Date().toISOString();
  return { id, name, doctorId, condition, createdAt: now, updatedAt: now };
}

async function installSyntheticApi(page, { rejectLogin = false, setupCodeRequired = false, setupDisabled = false, setupCode = "synthetic-one-time-setup-code-1234567890" } = {}) {
  const state = {
    session: false,
    registrationOpen: true,
    setupCodeRequired,
    setupDisabled,
    setupCode,
    doctors: [],
    patients: [],
    requests: []
  };

  await page.route(`${API}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace("/api/v1", "");
    const method = request.method().toUpperCase();
    const headers = request.headers();
    const body = method === "POST" || method === "PATCH" ? (request.postDataJSON() ?? {}) : {};
    state.requests.push({ method, path, headers, body });

    const corsHeaders = {
      "access-control-allow-origin": "http://127.0.0.1:3000",
      "access-control-allow-credentials": "true",
      "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "access-control-allow-headers": "Content-Type, X-CSRF-Token",
      "access-control-max-age": "600",
      "vary": "Origin"
    };

    if (method === "OPTIONS") {
      await route.fulfill({ status: 204, headers: corsHeaders });
      return;
    }

    const send = async (status, data, meta = {}) => {
      if (status === 204) {
        await route.fulfill({ status: 204 });
        return;
      }
      const payload = status >= 400
        ? { error: { code: status === 401 ? "UNAUTHENTICATED" : "E2E_ERROR", message: data } }
        : { data, meta: { requestId: "synthetic-e2e", ...meta } };
      await route.fulfill({
        status,
        contentType: "application/json",
        headers: { ...corsHeaders, "cache-control": "no-store" },
        body: JSON.stringify(payload)
      });
    };

    if (path === "/auth/registration-status" && method === "GET") {
      return send(200, { registrationOpen: state.registrationOpen && !state.setupDisabled, setupCodeRequired: state.setupCodeRequired, setupDisabled: state.setupDisabled });
    }

    if (path === "/auth/register" && method === "POST") {
      if (!state.registrationOpen) return send(409, "Initial registration is unavailable.");
      if (state.setupCodeRequired && body.setupToken !== state.setupCode) return send(403, "The one-time setup code is invalid.");
      if (!state.setupCodeRequired && Object.hasOwn(body, "setupToken")) return send(400, "Unexpected registration field.");
      if (typeof body.email !== "string" || typeof body.password !== "string" || body.password.length < 14 || body.password.length > 128) {
        return send(400, "Provide a valid email and a password between 14 and 128 characters.");
      }
      state.registrationOpen = false;
      state.session = true;
      return send(201, {
        user: { id: "aaaaaaaaaaaaaaaaaaaaaaaa", email: body.email.trim().toLowerCase(), role: "ADMIN" },
        csrfToken: CSRF,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      });
    }

    if (path === "/auth/me" && method === "GET") {
      if (!state.session) return send(401, "Authentication required.");
      return send(200, {
        user: { id: "aaaaaaaaaaaaaaaaaaaaaaaa", email: "admin@example.test", role: "ADMIN" },
        csrfToken: CSRF,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      });
    }

    if (path === "/auth/login" && method === "POST") {
      if (rejectLogin || body.email !== "admin@example.test" || body.password !== "synthetic-password") {
        return send(401, "Email or password is incorrect.");
      }
      state.session = true;
      return send(200, {
        user: { id: "aaaaaaaaaaaaaaaaaaaaaaaa", email: "admin@example.test", role: "ADMIN" },
        csrfToken: CSRF,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
      });
    }

    if (path === "/auth/logout" && method === "POST") {
      if (!state.session) return send(401, "Authentication required.");
      if (headers["x-csrf-token"] !== CSRF) return send(403, "CSRF token is invalid.");
      state.session = false;
      return send(204);
    }

    if (!state.session) return send(401, "Authentication required.");

    if (path === "/dashboard/summary" && method === "GET") {
      const date = todayUtc();
      return send(200, {
        totals: { doctors: state.doctors.length, patients: state.patients.length },
        patientsPerDoctor: state.doctors.map((doctor) => ({
          doctorId: doctor.id,
          doctorName: doctor.name,
          patientCount: state.patients.filter((patient) => patient.doctorId === doctor.id).length
        })),
        dateStatistics: {
          from: url.searchParams.get("from") ?? date,
          to: url.searchParams.get("to") ?? date,
          days: [{ date, doctorsCreated: state.doctors.length, patientsCreated: state.patients.length }]
        }
      });
    }

    const detachMatch = path.match(/^\/doctors\/([a-f\d]{24})\/patients\/([a-f\d]{24})$/i);
    if (detachMatch && method === "DELETE") {
      if (headers["x-csrf-token"] !== CSRF) return send(403, "CSRF token is invalid.");
      const [, doctorId, patientId] = detachMatch;
      const patient = state.patients.find((entry) => entry.id === patientId && entry.doctorId === doctorId);
      if (!patient) return send(404, "Patient not found for this doctor.");
      patient.doctorId = null;
      patient.updatedAt = new Date().toISOString();
      return send(204);
    }

    const associatedMatch = path.match(/^\/doctors\/([a-f\d]{24})\/patients$/i);
    if (associatedMatch && method === "GET") {
      const doctorId = associatedMatch[1];
      if (!state.doctors.some((doctor) => doctor.id === doctorId)) return send(404, "Doctor not found.");
      const pageNumber = Number(url.searchParams.get("page") ?? "1");
      const limit = Number(url.searchParams.get("limit") ?? "20");
      const rows = state.patients.filter((patient) => patient.doctorId === doctorId);
      const visible = rows.slice((pageNumber - 1) * limit, pageNumber * limit);
      return send(200, { patients: visible }, {
        pagination: { page: pageNumber, limit, total: rows.length, totalPages: Math.ceil(rows.length / limit) }
      });
    }

    if (path === "/doctors" && method === "GET") {
      let rows = [...state.doctors];
      const search = url.searchParams.get("search")?.toLocaleLowerCase();
      const specialization = url.searchParams.get("specialization")?.toLocaleLowerCase();
      const hospital = url.searchParams.get("hospital")?.toLocaleLowerCase();
      const from = url.searchParams.get("from");
      const to = url.searchParams.get("to");
      if (search) rows = rows.filter((row) => [row.name, row.specialization, row.hospital, row.email].some((value) => value.toLocaleLowerCase().startsWith(search)));
      if (specialization) rows = rows.filter((row) => row.specialization.toLocaleLowerCase() === specialization);
      if (hospital) rows = rows.filter((row) => row.hospital.toLocaleLowerCase() === hospital);
      if (from) rows = rows.filter((row) => row.createdAt.slice(0, 10) >= from);
      if (to) rows = rows.filter((row) => row.createdAt.slice(0, 10) <= to);
      rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
      const pageNumber = Number(url.searchParams.get("page") ?? "1");
      const limit = Number(url.searchParams.get("limit") ?? "20");
      const visible = rows.slice((pageNumber - 1) * limit, pageNumber * limit);
      return send(200, { doctors: visible }, {
        pagination: { page: pageNumber, limit, total: rows.length, totalPages: Math.ceil(rows.length / limit) }
      });
    }

    if (path === "/doctors" && method === "POST") {
      if (headers["x-csrf-token"] !== CSRF) return send(403, "CSRF token is invalid.");
      if (state.doctors.some((doctor) => doctor.email.toLocaleLowerCase() === String(body.email).toLocaleLowerCase())) {
        return route.fulfill({ status: 409, contentType: "application/json", headers: corsHeaders, body: JSON.stringify({ error: { code: "DOCTOR_EMAIL_EXISTS", message: "A doctor with this email already exists." } }) });
      }
      const doctor = doctorRecord({ ...body, id: DOCTOR_ID, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      state.doctors.push(doctor);
      return send(201, { doctor });
    }

    const doctorDetail = path.match(/^\/doctors\/([a-f\d]{24})$/i);
    if (doctorDetail && method === "GET") {
      const doctor = state.doctors.find((entry) => entry.id === doctorDetail[1]);
      return doctor ? send(200, { doctor }) : send(404, "Doctor not found.");
    }
    if (doctorDetail && method === "PATCH") {
      if (headers["x-csrf-token"] !== CSRF) return send(403, "CSRF token is invalid.");
      const doctor = state.doctors.find((entry) => entry.id === doctorDetail[1]);
      if (!doctor) return send(404, "Doctor not found.");
      Object.assign(doctor, body, { updatedAt: new Date().toISOString() });
      return send(200, { doctor });
    }

    if (path === "/patients" && method === "GET") {
      let rows = [...state.patients];
      const search = url.searchParams.get("search")?.toLocaleLowerCase();
      const doctorId = url.searchParams.get("doctorId");
      const condition = url.searchParams.get("condition")?.normalize("NFKC").trim().toLocaleLowerCase();
      const from = url.searchParams.get("from");
      const to = url.searchParams.get("to");
      if (search) rows = rows.filter((row) => [row.name, row.condition ?? ""].some((value) => value.toLocaleLowerCase().startsWith(search)));
      if (doctorId) rows = rows.filter((row) => row.doctorId === doctorId);
      if (condition) rows = rows.filter((row) => (row.condition ?? "").normalize("NFKC").trim().toLocaleLowerCase() === condition);
      if (from) rows = rows.filter((row) => row.createdAt.slice(0, 10) >= from);
      if (to) rows = rows.filter((row) => row.createdAt.slice(0, 10) <= to);
      rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
      const pageNumber = Number(url.searchParams.get("page") ?? "1");
      const limit = Number(url.searchParams.get("limit") ?? "20");
      const visible = rows.slice((pageNumber - 1) * limit, pageNumber * limit);
      return send(200, { patients: visible }, {
        pagination: { page: pageNumber, limit, total: rows.length, totalPages: Math.ceil(rows.length / limit) }
      });
    }

    if (path === "/patients" && method === "POST") {
      if (headers["x-csrf-token"] !== CSRF) return send(403, "CSRF token is invalid.");
      if (!state.doctors.some((doctor) => doctor.id === body.doctorId)) return send(404, "Doctor not found.");
      const patientId = state.patients.some((patient) => patient.id === PATIENT_ONE_ID) ? PATIENT_TWO_ID : PATIENT_ONE_ID;
      const patient = patientRecord(patientId, body.name, body.doctorId, body.condition);
      state.patients.push(patient);
      return send(201, { patient });
    }

    const patientDetail = path.match(/^\/patients\/([a-f\d]{24})$/i);
    if (patientDetail && method === "GET") {
      const patient = state.patients.find((entry) => entry.id === patientDetail[1]);
      return patient ? send(200, { patient }) : send(404, "Patient not found.");
    }
    if (patientDetail && method === "PATCH") {
      if (headers["x-csrf-token"] !== CSRF) return send(403, "CSRF token is invalid.");
      const patient = state.patients.find((entry) => entry.id === patientDetail[1]);
      if (!patient) return send(404, "Patient not found.");
      if (body.doctorId && !state.doctors.some((doctor) => doctor.id === body.doctorId)) return send(404, "Doctor not found.");
      Object.assign(patient, body, { updatedAt: new Date().toISOString() });
      return send(200, { patient });
    }
    if (patientDetail && method === "DELETE") {
      if (headers["x-csrf-token"] !== CSRF) return send(403, "CSRF token is invalid.");
      const index = state.patients.findIndex((entry) => entry.id === patientDetail[1]);
      if (index < 0) return send(404, "Patient not found.");
      state.patients.splice(index, 1);
      return send(204);
    }

    return send(404, "No synthetic API route matches this request.");
  });

  return state;
}

async function signIn(page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  await page.getByLabel("Administrator email").fill("admin@example.test");
  await page.getByLabel("Password").fill("synthetic-password");
  await page.getByRole("button", { name: /Sign in securely/ }).click();
  await expect(page.getByRole("heading", { name: "Good systems make better care." })).toBeVisible();
}

test("first-admin sign-up creates a session and closes registration after one account", async ({ page }) => {
  const state = await installSyntheticApi(page);
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "Create your account." })).toBeVisible();
  await page.getByLabel("Administrator email").fill("FIRST-ADMIN@example.test");
  await page.getByLabel("Create password").fill("synthetic first-admin password 2026!");
  await page.getByLabel("Confirm password").fill("synthetic first-admin password 2026!");
  await expect(page.getByRole("button", { name: /Create administrator/ })).toBeEnabled();
  await page.getByRole("button", { name: /Create administrator/ }).click();

  await expect(page.getByRole("heading", { name: "Good systems make better care." })).toBeVisible();
  expect(state.registrationOpen).toBe(false);
  expect(state.session).toBe(true);
  const registration = state.requests.find((entry) => entry.method === "POST" && entry.path === "/auth/register");
  expect(registration).toBeTruthy();
  expect(registration.body).toEqual({
    email: "FIRST-ADMIN@example.test",
    password: "synthetic first-admin password 2026!"
  });

  const browserStorage = await page.evaluate(() => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage)
  }));
  expect(browserStorage).toEqual({ local: [], session: [] });

  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "Your workspace is already configured." })).toBeVisible();
  await expect(page.getByRole("link", { name: "Return to sign in" })).toBeVisible();
});

test("first-admin sign-up fails closed when production setup is disabled", async ({ page }) => {
  await installSyntheticApi(page, { setupDisabled: true });
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "Initial setup is not enabled." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Check again" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Return to sign in" })).toBeVisible();
  await expect(page.locator("#signup-form")).toHaveCount(0);
});

test("first-admin sign-up sends a configured setup code only to the API", async ({ page }) => {
  const setupCode = "synthetic-one-time-setup-code-1234567890";
  const state = await installSyntheticApi(page, { setupCodeRequired: true, setupCode });
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "Create your account." })).toBeVisible();
  await expect(page.getByLabel("One-time setup code")).toBeVisible();
  await page.getByLabel("One-time setup code").fill(setupCode);
  await page.getByLabel("Administrator email").fill("FIRST-ADMIN@example.test");
  await page.getByLabel("Create password").fill("synthetic first-admin password 2026!");
  await page.getByLabel("Confirm password").fill("synthetic first-admin password 2026!");
  await page.getByRole("button", { name: /Create administrator/ }).click();
  await expect(page.getByRole("heading", { name: "Good systems make better care." })).toBeVisible();

  const registration = state.requests.find((entry) => entry.method === "POST" && entry.path === "/auth/register");
  expect(registration?.body).toEqual({
    email: "FIRST-ADMIN@example.test",
    password: "synthetic first-admin password 2026!",
    setupToken: setupCode
  });
  const browserStorage = await page.evaluate(() => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage)
  }));
  expect(browserStorage).toEqual({ local: [], session: [] });
});

test("production frontend applies a fresh nonce CSP and hydrates correctly after reload", async ({ page }) => {
  const cspErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error" && /content security policy|refused to (execute|load|apply)|subresource integrity|integrity check/i.test(message.text())) {
      cspErrors.push(message.text());
    }
  });

  await page.route(`${API}/**`, async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      headers: {
        "access-control-allow-origin": "http://127.0.0.1:3000",
        "access-control-allow-credentials": "true",
        "cache-control": "no-store"
      },
      body: JSON.stringify({ error: { code: "UNAUTHENTICATED", message: "Authentication required." } })
    });
  });

  const assertNoncePolicyAndHydration = async (response) => {
    expect(response).not.toBeNull();
    const headers = response.headers();
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["permissions-policy"]).toContain("camera=()");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["content-security-policy"]).toContain("connect-src 'self' http://127.0.0.1:4000");
    expect(headers["strict-transport-security"]).toBeUndefined();

    const nonce = headers["content-security-policy"].match(/'nonce-([^']+)'/)?.[1];
    expect(nonce).toBeTruthy();
    expect(headers["content-security-policy"]).toContain("'strict-dynamic'");
    expect(headers["content-security-policy"]).not.toMatch(/unsafe-inline|unsafe-eval/);

    const scriptNonces = await page.locator("script").evaluateAll((scripts) =>
      scripts.map((script) => script.nonce)
    );
    expect(scriptNonces.length).toBeGreaterThan(0);
    expect(scriptNonces.every((value) => value === nonce)).toBe(true);

    const styleNonces = await page.locator("style[nonce]").evaluateAll((styles) =>
      styles.map((style) => style.nonce)
    );
    expect(styleNonces.every((value) => value === nonce)).toBe(true);
    await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
    return nonce;
  };

  const firstResponse = await page.goto("/");
  const firstNonce = await assertNoncePolicyAndHydration(firstResponse);
  expect(cspErrors).toEqual([]);

  const secondResponse = await page.reload();
  const secondNonce = await assertNoncePolicyAndHydration(secondResponse);
  expect(secondNonce).not.toBe(firstNonce);
  expect(cspErrors).toEqual([]);
});

test("CSP matcher excludes only API/static path boundaries", async ({ page }) => {
  for (const path of ["/apiary-csp-boundary-regression", "/faviconXico-csp-boundary-regression"]) {
    const response = await page.goto(path);
    expect(response).not.toBeNull();
    expect(response.status()).toBe(404);

    const csp = response.headers()["content-security-policy"] ?? "";
    expect(csp).toMatch(/'nonce-[^']+'/);
    expect(csp).toContain("'strict-dynamic'");
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval/);
  }
});

test("admin can create a doctor and patient, detach without deleting, then explicitly delete another patient", async ({ page }, testInfo) => {
  const state = await installSyntheticApi(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await signIn(page);

  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("button", { name: /Doctors/ }).click();
  await expect(page.getByRole("heading", { name: "Care team directory" })).toBeVisible();
  await page.getByRole("button", { name: /Add doctor/ }).click();
  const doctorForm = page.locator(".doctor-editor form");
  await doctorForm.getByLabel(/Full name/).fill("Dr. Amina Rahman");
  await doctorForm.getByLabel(/^Specialization/).fill("Cardiology");
  await doctorForm.getByLabel(/Hospital \/ clinic/).fill("Synthetic City Hospital");
  await doctorForm.getByLabel(/^Phone/).fill("+880 1700-000001");
  await doctorForm.getByLabel(/^Email address/).fill("amina@example.test");
  await doctorForm.getByRole("button", { name: "Create doctor" }).click();

  await expect(page.getByRole("heading", { name: "Dr. Amina Rahman" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Associated patients/ })).toBeVisible();
  await page.getByRole("button", { name: /Add patient/ }).click();
  await expect(page.getByRole("heading", { name: "Add a patient" })).toBeVisible();
  await expect(page.getByLabel(/Doctor association/)).toHaveValue(DOCTOR_ID);
  await page.getByLabel(/Patient name/).fill("Synthetic Patient One");
  await page.locator(".patient-editor form").getByLabel(/^Condition/).fill("Routine follow-up");
  await page.getByRole("button", { name: "Create patient" }).click();
  await expect(page.getByRole("heading", { name: "Synthetic Patient One" })).toBeVisible();

  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("button", { name: /Doctors/ }).click();
  await page.locator(".doctor-table").getByRole("button", { name: "Dr. Amina Rahman", exact: true }).click();
  await expect(page.getByText("Synthetic Patient One")).toBeVisible();
  await page.getByRole("button", { name: "View all" }).click();
  await expect(page.getByRole("heading", { name: "Patient directory" })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "Synthetic Patient One" })).toBeVisible();
  await page.getByRole("button", { name: "Reset" }).click();
  await page.getByRole("button", { name: "Synthetic Patient One" }).click();
  await page.getByRole("button", { name: "Edit details" }).click();
  await page.locator(".patient-editor form").getByLabel(/^Condition/).fill("Routine follow-up updated");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("heading", { name: "Synthetic Patient One" })).toBeVisible();
  expect(state.patients.find((patient) => patient.name === "Synthetic Patient One")?.condition).toBe("Routine follow-up updated");

  await page.getByLabel("Search patients").fill("Synthetic Patient One");
  await page.getByLabel("Condition (exact)").fill("Routine follow-up updated");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByRole("row").filter({ hasText: "Synthetic Patient One" })).toBeVisible();
  await page.getByRole("button", { name: "Reset" }).click();

  await page.getByRole("button", { name: "Detach from doctor" }).click();
  const detachDialog = page.getByRole("dialog", { name: "Detach this patient from the doctor?" });
  await expect(detachDialog).toBeVisible();
  await expect(detachDialog.getByRole("button", { name: "Cancel" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(detachDialog).toBeHidden();
  await page.getByRole("button", { name: "Detach from doctor" }).click();
  await page.getByRole("dialog", { name: "Detach this patient from the doctor?" }).getByRole("button", { name: "Detach and preserve" }).click();
  const patientOneRow = page.getByRole("row").filter({ hasText: "Synthetic Patient One" });
  await expect(patientOneRow).toBeVisible();
  await expect(patientOneRow.getByText("Unassigned")).toBeVisible();
  expect(state.patients.some((patient) => patient.name === "Synthetic Patient One" && patient.doctorId === null)).toBe(true);

  await page.getByRole("button", { name: /Add patient/ }).click();
  await page.getByLabel(/Patient name/).fill("Synthetic Patient Two");
  await page.getByLabel(/Doctor association/).selectOption(DOCTOR_ID);
  await page.locator(".patient-editor form").getByLabel(/^Condition/).fill("Synthetic example only");
  await page.getByRole("button", { name: "Create patient" }).click();
  await expect(page.getByRole("heading", { name: "Synthetic Patient Two" })).toBeVisible();
  await page.getByRole("button", { name: "Delete patient record" }).click();
  const deleteDialog = page.getByRole("dialog", { name: "Delete this patient record?" });
  await expect(deleteDialog).toBeVisible();
  await deleteDialog.getByRole("button", { name: "Delete permanently" }).click();
  await expect(page.getByRole("button", { name: "Synthetic Patient Two" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Synthetic Patient One" })).toBeVisible();
  expect(state.patients.some((patient) => patient.name === "Synthetic Patient Two")).toBe(false);

  const patientRow = page.getByRole("row").filter({ hasText: "Synthetic Patient One" });
  await expect(patientRow).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("patient-management-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Patient directory" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("patient-management-mobile.png"), fullPage: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("button", { name: /Dashboard/ }).click();
  await expect(page.getByRole("heading", { name: "Your practice, in focus" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Doctor records", exact: true }).locator("xpath=..").locator(".metric-value > span")).toHaveText("1");
  await expect(page.getByRole("heading", { name: "Patient records", exact: true }).locator("xpath=..").locator(".metric-value > span")).toHaveText("1");
  await page.getByRole("button", { name: "Sign out of the administrator session" }).click();
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  expect(state.session).toBe(false);

  expect(state.requests.some((request) => request.method === "POST" && request.path === "/doctors" && request.headers["x-csrf-token"] === CSRF)).toBe(true);
  expect(state.requests.some((request) => request.method === "POST" && request.path === "/patients" && request.headers["x-csrf-token"] === CSRF)).toBe(true);
  expect(state.requests.some((request) => request.method === "DELETE" && request.path === `/doctors/${DOCTOR_ID}/patients/${PATIENT_ONE_ID}` && request.headers["x-csrf-token"] === CSRF)).toBe(true);
  expect(state.requests.some((request) => request.method === "DELETE" && request.path === `/patients/${PATIENT_TWO_ID}` && request.headers["x-csrf-token"] === CSRF)).toBe(true);
});

test("invalid sign-in stays on the sign-in page and never persists session tokens", async ({ page }) => {
  await installSyntheticApi(page, { rejectLogin: true });
  await page.goto("/");
  await page.getByLabel("Administrator email").fill("admin@example.test");
  await page.getByLabel("Password").fill("incorrect-synthetic-password");
  await page.getByRole("button", { name: /Sign in securely/ }).click();
  await expect(page.locator("#login-error")).toHaveText("Email or password is incorrect.");
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  const storedKeys = await page.evaluate(() => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage)
  }));
  expect(storedKeys.local).toEqual([]);
  expect(storedKeys.session).toEqual([]);
});
