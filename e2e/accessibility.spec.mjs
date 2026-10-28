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
const DOCTOR_ID = "bbbbbbbbbbbbbbbbbbbbbbbb";
const PATIENT_ID = "cccccccccccccccccccccccc";
const DOCTOR_RECORD = {
  id: DOCTOR_ID,
  name: "Dr. Ada Example",
  specialization: "Family Medicine",
  hospital: "Example Clinic",
  phone: "+880 1700 000000",
  email: "ada@example.test",
  createdAt: "2026-01-02T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z"
};
const PATIENT_RECORD = {
  id: PATIENT_ID,
  doctorId: DOCTOR_ID,
  name: "Sam Patient",
  condition: "Routine follow-up",
  createdAt: "2026-01-03T00:00:00.000Z",
  updatedAt: "2026-01-03T00:00:00.000Z"
};

async function installSyntheticApi(page, options = {}) {
  const state = {
    authenticated: false,
    doctors: options.seedDoctor || options.seedPatient ? [{ ...DOCTOR_RECORD }] : [],
    patients: options.seedPatient ? [{ ...PATIENT_RECORD }] : []
  };
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
    const body = request.postData() ? request.postDataJSON() : {};
    if (method === "DELETE" && options.actionDelayMs) {
      await new Promise((resolve) => setTimeout(resolve, options.actionDelayMs));
    }

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
        totals: { doctors: state.doctors.length, patients: state.patients.length },
        patientsPerDoctor: state.doctors.map((doctor) => ({
          doctorId: doctor.id,
          doctorName: doctor.name,
          patientCount: state.patients.filter((patient) => patient.doctorId === doctor.id).length
        })),
        dateStatistics: {
          from: url.searchParams.get("from") ?? today,
          to: url.searchParams.get("to") ?? today,
          days: [{ date: today, doctorsCreated: state.doctors.length, patientsCreated: state.patients.length }]
        }
      });
    }
    if (path === "/doctors" && method === "GET") {
      const pageNumber = Number(url.searchParams.get("page") ?? "1");
      const limit = Number(url.searchParams.get("limit") ?? "20");
      const visible = state.doctors.slice((pageNumber - 1) * limit, pageNumber * limit);
      return send(200, { doctors: visible }, {
        pagination: { page: pageNumber, limit, total: state.doctors.length, totalPages: Math.ceil(state.doctors.length / limit) }
      });
    }
    if (path === "/doctors" && method === "POST") {
      const duplicate = state.doctors.some((doctor) => doctor.email.toLowerCase() === String(body.email ?? "").toLowerCase());
      if (duplicate) return send(409, "A doctor with this email already exists.");
      const doctor = { ...DOCTOR_RECORD, ...body, id: "dddddddddddddddddddddddd", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      state.doctors.push(doctor);
      return send(201, { doctor });
    }
    const doctorDetail = path.match(/^\/doctors\/([a-f\d]{24})$/i);
    if (doctorDetail && method === "GET") {
      const doctor = state.doctors.find((entry) => entry.id === doctorDetail[1]);
      return doctor ? send(200, { doctor }) : send(404, "Doctor not found.");
    }
    if (doctorDetail && method === "PATCH") {
      const doctor = state.doctors.find((entry) => entry.id === doctorDetail[1]);
      if (!doctor) return send(404, "Doctor not found.");
      Object.assign(doctor, body, { updatedAt: new Date().toISOString() });
      return send(200, { doctor });
    }
    const associatedPatients = path.match(/^\/doctors\/([a-f\d]{24})\/patients$/i);
    if (associatedPatients && method === "GET") {
      const rows = state.patients.filter((patient) => patient.doctorId === associatedPatients[1]);
      return send(200, { patients: rows.slice(0, 10) }, {
        pagination: { page: 1, limit: 10, total: rows.length, totalPages: Math.ceil(rows.length / 10) }
      });
    }
    if (path === "/patients" && method === "GET") {
      const pageNumber = Number(url.searchParams.get("page") ?? "1");
      const limit = Number(url.searchParams.get("limit") ?? "20");
      const visible = state.patients.slice((pageNumber - 1) * limit, pageNumber * limit);
      return send(200, { patients: visible }, {
        pagination: { page: pageNumber, limit, total: state.patients.length, totalPages: Math.ceil(state.patients.length / limit) }
      });
    }
    if (path === "/patients" && method === "POST") {
      if (body.condition === "force-validation-error") {
        return send(400, "Condition failed validation for the synthetic accessibility scenario.");
      }
      const patient = {
        ...PATIENT_RECORD,
        ...body,
        id: "eeeeeeeeeeeeeeeeeeeeeeee",
        doctorId: body.doctorId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      state.patients.push(patient);
      return send(201, { patient });
    }
    const patientDetail = path.match(/^\/patients\/([a-f\d]{24})$/i);
    if (patientDetail && method === "GET") {
      const patient = state.patients.find((entry) => entry.id === patientDetail[1]);
      return patient ? send(200, { patient }) : send(404, "Patient not found.");
    }
    return send(404, "No accessibility-test route matches this request.");
  });
}

async function navigateToSection(page, label, mobile) {
  if (mobile) {
    const openMenu = page.getByRole("banner").getByRole("button", { name: "Open navigation" });
    await openMenu.click();
  }
  await page.getByRole("navigation", { name: "Primary navigation" })
    .getByRole("button", { name: new RegExp(label) }).click();
}

async function signIn(page, { doctorCount = 0 } = {}) {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
  await page.getByLabel("Administrator email").fill("accessibility-admin@example.test");
  await page.getByLabel("Password").fill("accessibility-synthetic-password");
  await page.getByLabel("Password").press("Enter");
  await expect(page.getByRole("heading", { name: "Good systems make better care." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Doctor records", exact: true })
    .locator("xpath=..").locator(".metric-value > span")).toHaveText(String(doctorCount));
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

  await navigateToSection(page, "Doctors", testInfo.project.name === "chromium-mobile");
  await expect(page.getByRole("heading", { name: "Care team directory" })).toBeVisible();
  await expect(page.locator(".doctor-empty-state")).toBeVisible();
  await scanScreen(page, testInfo, "doctors");

  await navigateToSection(page, "Patients", testInfo.project.name === "chromium-mobile");
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
  await expect(page.getByRole("link", { name: /doctortracker/i })).toBeFocused();
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

  const menuButton = page.getByRole("banner").getByRole("button", { name: "Open navigation" });
  await menuButton.focus();
  await page.keyboard.press("Enter");
  const closeMenuButton = page.getByRole("banner").getByRole("button", { name: "Close navigation" });
  await expect(closeMenuButton).toBeVisible();
  await expect(page.locator("#primary-sidebar .nav-link").first()).toBeFocused();

  await page.keyboard.press("Escape");
  const restoredMenuButton = page.getByRole("banner").getByRole("button", { name: "Open navigation" });
  await expect(restoredMenuButton).toHaveAttribute("aria-expanded", "false");
  await expect(restoredMenuButton).toBeFocused();
});


test("doctor create/edit forms support keyboard navigation and announce duplicate-email errors", async ({ page }, testInfo) => {
  await installSyntheticApi(page, { seedDoctor: true });
  await signIn(page, { doctorCount: 1 });
  await navigateToSection(page, "Doctors", testInfo.project.name === "chromium-mobile");
  const doctorRow = page.locator(".doctor-table").getByRole("button", { name: DOCTOR_RECORD.name, exact: true });
  await expect(doctorRow).toBeVisible();
  await doctorRow.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: DOCTOR_RECORD.name, exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Edit details" }).click();

  const editForm = page.locator(".doctor-form");
  await expect(page.getByRole("heading", { name: "Update doctor details" })).toBeFocused();
  await expect(editForm.locator('input[name="name"]')).toHaveValue(DOCTOR_RECORD.name);
  await scanScreen(page, testInfo, "doctor-edit-form");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(editForm.locator('input[name="name"]')).toBeFocused();

  await page.getByRole("button", { name: "Cancel" }).click();
  await page.getByRole("button", { name: /Add doctor/ }).click();
  await expect(page.getByRole("heading", { name: "Add a doctor" })).toBeFocused();
  const createForm = page.locator(".doctor-form");
  await createForm.locator('input[name="name"]').fill("Dr. Duplicate Example");
  await createForm.locator('input[name="specialization"]').fill("Family Medicine");
  await createForm.locator('input[name="hospital"]').fill("Example Clinic");
  await createForm.locator('input[name="phone"]').fill("+880 1700 000001");
  await createForm.locator('input[name="email"]').fill(DOCTOR_RECORD.email);
  await createForm.getByRole("button", { name: "Create doctor" }).click();

  const email = createForm.locator('input[name="email"]');
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAttribute("aria-describedby", "doctor-field-error-email");
  await expect(page.locator("#doctor-field-error-email")).toHaveText("A doctor with this email already exists.");
  await scanScreen(page, testInfo, "doctor-create-validation");
});

test("patient create/edit form validation errors are linked to their fields", async ({ page }, testInfo) => {
  await installSyntheticApi(page, { seedDoctor: true, seedPatient: true });
  await signIn(page, { doctorCount: 1 });
  await navigateToSection(page, "Patients", testInfo.project.name === "chromium-mobile");
  await page.getByRole("button", { name: /Add patient/ }).click();

  const createForm = page.locator(".patient-form");
  await expect(page.getByRole("heading", { name: "Add a patient" })).toBeFocused();
  await expect(createForm.getByLabel(/Doctor association/).locator("option").nth(1)).toHaveText("Dr. Ada Example — Family Medicine");
  await scanScreen(page, testInfo, "patient-create-form");
  await createForm.locator('input[name="name"]').fill("Synthetic Patient Validation");
  await createForm.locator('select[name="doctorId"]').selectOption(DOCTOR_ID);
  await createForm.locator('input[name="condition"]').fill("force-validation-error");
  await createForm.getByRole("button", { name: "Create patient" }).click();

  const condition = createForm.locator('input[name="condition"]');
  await expect(condition).toHaveAttribute("aria-invalid", "true");
  await expect(condition).toHaveAttribute("aria-describedby", "patient-field-error-condition");
  await expect(page.locator("#patient-field-error-condition")).toHaveText("Condition failed validation for the synthetic accessibility scenario.");
  await scanScreen(page, testInfo, "patient-create-validation");

  await page.getByRole("button", { name: "Cancel" }).click();
  await page.locator(".patient-table").getByRole("button", { name: PATIENT_RECORD.name, exact: true }).click();
  await expect(page.getByRole("heading", { name: PATIENT_RECORD.name, exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Edit details" }).click();
  const editForm = page.locator(".patient-form");
  await expect(page.getByRole("heading", { name: "Update patient details" })).toBeFocused();
  await expect(editForm.locator('input[name="name"]')).toHaveValue(PATIENT_RECORD.name);
  await scanScreen(page, testInfo, "patient-edit-form");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Cancel" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(editForm.locator('input[name="name"]')).toBeFocused();
});

test("confirmation dialog contains escaped focus and stays modal while an action is pending", async ({ page }, testInfo) => {
  await installSyntheticApi(page, { seedPatient: true, actionDelayMs: 1200 });
  await signIn(page, { doctorCount: 1 });
  await navigateToSection(page, "Patients", testInfo.project.name === "chromium-mobile");

  const patientRow = page.getByRole("row").filter({ hasText: PATIENT_RECORD.name });
  const deleteTrigger = patientRow.getByRole("button", { name: "Delete", exact: true });
  await deleteTrigger.click();

  const dialog = page.getByRole("dialog", { name: "Delete this patient record?" });
  const cancel = dialog.getByRole("button", { name: "Cancel" });
  const confirm = dialog.getByRole("button", { name: "Delete permanently" });
  const backgroundAction = page.getByRole("button", { name: /Add patient/ });
  await expect(cancel).toBeFocused();

  // aria-modal alone does not prevent script-driven focus from moving outside.
  await backgroundAction.focus();
  await page.keyboard.press("Tab");
  await expect(cancel).toBeFocused();
  await backgroundAction.focus();
  await page.keyboard.press("Shift+Tab");
  await expect(confirm).toBeFocused();

  // The action disables both dialog buttons temporarily. Focus must remain in
  // the modal, and Tab must not move into the background while no controls work.
  await confirm.click();
  await expect(confirm).toBeDisabled();
  await expect(dialog).toContainText("Working…");
  await backgroundAction.focus();
  await page.keyboard.press("Tab");
  await expect(dialog).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog).toBeFocused();

  await expect(dialog).toBeHidden({ timeout: 5_000 });
  await expect(page.getByText("Patient record permanently deleted.", { exact: true })).toBeVisible();
  await expect(patientRow).toHaveCount(0);
});

test("delete confirmation dialog has a keyboard focus loop and restores focus on dismissal", async ({ page }, testInfo) => {
  await installSyntheticApi(page, { seedPatient: true });
  await signIn(page, { doctorCount: 1 });
  await navigateToSection(page, "Patients", testInfo.project.name === "chromium-mobile");

  const deleteTrigger = page.getByRole("row").filter({ hasText: PATIENT_RECORD.name })
    .getByRole("button", { name: "Delete", exact: true });
  await expect(deleteTrigger).toBeVisible();
  await deleteTrigger.click();
  const dialog = page.getByRole("dialog", { name: "Delete this patient record?" });
  const cancel = dialog.getByRole("button", { name: "Cancel" });
  const confirm = dialog.getByRole("button", { name: "Delete permanently" });
  await expect(dialog).toBeVisible();
  await expect(cancel).toBeFocused();
  await scanScreen(page, testInfo, "patient-delete-dialog");

  await page.keyboard.press("Tab");
  await expect(confirm).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(cancel).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(confirm).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(deleteTrigger).toBeFocused();

  await deleteTrigger.click();
  await expect(cancel).toBeFocused();
  await cancel.click();
  await expect(dialog).toBeHidden();
  await expect(deleteTrigger).toBeFocused();
});
