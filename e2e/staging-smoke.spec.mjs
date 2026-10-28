import { randomUUID } from "node:crypto";
import { test, expect, request } from "../.e2e-tools/node_modules/@playwright/test/index.mjs";

const API = process.env.STAGING_API_BASE_URL?.replace(/\/+$/, "");
const ADMIN_EMAIL = process.env.STAGING_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.STAGING_ADMIN_PASSWORD;
const DOCTOR_ID = process.env.STAGING_DOCTOR_ID;

function assertConfiguration() {
  if (!API || !ADMIN_EMAIL || !ADMIN_PASSWORD || !DOCTOR_ID) {
    throw new Error(
      "Staging API URL, staging administrator secrets, and synthetic doctor fixture must be configured."
    );
  }
}

function apiResponse(response, path, method) {
  const expectedPath = new URL(API).pathname.replace(/\/+$/, "") + path;
  return new URL(response.url()).pathname === expectedPath &&
    response.request().method() === method;
}

async function findSyntheticPatient(page, name) {
  return page.evaluate(async ({ api, patientName }) => {
    const url = new URL(api + "/patients");
    url.searchParams.set("search", patientName);
    url.searchParams.set("limit", "10");
    const response = await fetch(url.toString(), { credentials: "include" });
    let body = null;
    try {
      body = await response.json();
    } catch {
      // The status and empty shape below will make a non-JSON response fail acceptance.
    }
    return {
      status: response.status,
      total: body?.meta?.pagination?.total,
      patients: body?.data?.patients ?? []
    };
  }, { api: API, patientName: name });
}

async function cleanupSyntheticPatient(page, patientName) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Your practice, in focus" })
  ).toBeVisible({ timeout: 15_000 });

  await page.getByRole("navigation", { name: "Primary navigation" })
    .getByRole("button", { name: /Patients/ }).click();
  await expect(page.getByRole("heading", { name: "Patient directory" })).toBeVisible();

  await page.getByLabel("Search patients").fill(patientName);
  await page.getByRole("button", { name: "Apply filters" }).click();
  const patientButton = page.locator(".patient-table tbody")
    .getByRole("button", { name: patientName, exact: true });

  if (await patientButton.count()) {
    await patientButton.first().click();
    await page.getByRole("button", { name: "Delete patient record" }).click();
    await page.getByRole("dialog", { name: "Delete this patient record?" })
      .getByRole("button", { name: "Delete permanently" }).click();
  }

  const result = await findSyntheticPatient(page, patientName);
  if (result.status !== 200 || result.total !== 0) {
    throw new Error("The synthetic staging patient could not be confirmed deleted.");
  }
}

test("deployed staging supports secure session, CSRF rejection, patient persistence and revocation", async ({ page }) => {
  assertConfiguration();
  test.setTimeout(120_000);

  const suffix = randomUUID().replace(/-/g, "").slice(0, 10);
  const patientName = "Staging Smoke Patient " + suffix;
  const condition = "Staging smoke verification " + suffix;
  let patientMayExist = false;
  let sessionCookie;

  try {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
    await page.getByLabel("Administrator email").fill(ADMIN_EMAIL);
    await page.getByLabel("Password").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /Sign in securely/ }).click();
    await expect(page.getByRole("heading", { name: "Your practice, in focus" })).toBeVisible();

    sessionCookie = (await page.context().cookies(API)).find((cookie) => cookie.name === "dt_session");
    expect(sessionCookie, "authenticated API session cookie").toBeDefined();
    expect(sessionCookie.httpOnly, "session cookie must be HttpOnly").toBe(true);
    expect(sessionCookie.secure, "session cookie must be Secure on HTTPS").toBe(true);
    expect(["Strict", "Lax", "None"], "session cookie must declare SameSite").toContain(sessionCookie.sameSite);

    const noCsrf = await page.evaluate(async ({ api, id }) => {
      const response = await fetch(api + "/doctors", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Must Not Persist " + id,
          specialization: "Cardiology",
          hospital: "Staging Smoke Test",
          phone: "+880 1700-100001",
          email: "no-csrf-" + id + "@example.test"
        })
      });
      let body = null;
      try {
        body = await response.json();
      } catch {
        // A missing error envelope is caught by the assertion below.
      }
      return { status: response.status, code: body?.error?.code };
    }, { api: API, id: suffix });
    expect(noCsrf).toEqual({ status: 403, code: "CSRF_VALIDATION_FAILED" });

    const doctor = await page.evaluate(async ({ api, doctorId }) => {
      const response = await fetch(api + "/doctors/" + encodeURIComponent(doctorId), {
        credentials: "include"
      });
      let body = null;
      try {
        body = await response.json();
      } catch {
        // Treat malformed responses as a failed fixture check.
      }
      return { status: response.status, id: body?.data?.doctor?.id };
    }, { api: API, doctorId: DOCTOR_ID });
    expect(doctor.status, "synthetic staging doctor fixture must be readable").toBe(200);
    expect(doctor.id).toBe(DOCTOR_ID);

    await page.getByRole("navigation", { name: "Primary navigation" })
      .getByRole("button", { name: /Patients/ }).click();
    await expect(page.getByRole("heading", { name: "Patient directory" })).toBeVisible();
    await page.getByRole("button", { name: /Add patient/ }).click();
    await expect(page.getByRole("heading", { name: "Add a patient" })).toBeVisible();
    await page.getByLabel(/Patient name/).fill(patientName);
    await page.getByLabel(/Doctor association/).selectOption(DOCTOR_ID);
    await page.locator(".patient-editor form").getByLabel(/^Condition/).fill(condition);

    const createResponsePromise = page.waitForResponse((response) =>
      apiResponse(response, "/patients", "POST")
    );
    // Arm cleanup before the request: a timeout/5xx can still follow a committed insert.
    patientMayExist = true;
    await page.getByRole("button", { name: "Create patient" }).click();
    const createResponse = await createResponsePromise;
    expect(createResponse.status()).toBe(201);
    await expect(page.getByRole("heading", { name: patientName })).toBeVisible();

    let persisted = await findSyntheticPatient(page, patientName);
    expect(persisted.status).toBe(200);
    expect(persisted.total).toBe(1);
    expect(persisted.patients[0]?.doctorId).toBe(DOCTOR_ID);
    expect(persisted.patients[0]?.condition).toBe(condition);

    const updatedCondition = condition + " updated";
    await page.getByRole("button", { name: "Edit details" }).click();
    await expect(page.getByRole("heading", { name: "Update patient details" })).toBeVisible();
    await page.locator(".patient-editor form").getByLabel(/^Condition/).fill(updatedCondition);
    const patchResponsePromise = page.waitForResponse((response) =>
      apiResponse(response, "/patients/" + persisted.patients[0].id, "PATCH")
    );
    await page.getByRole("button", { name: "Save changes" }).click();
    const patchResponse = await patchResponsePromise;
    expect(patchResponse.ok()).toBe(true);
    await expect(page.getByRole("heading", { name: patientName })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "Your practice, in focus" })).toBeVisible();
    await page.getByRole("navigation", { name: "Primary navigation" })
      .getByRole("button", { name: /Patients/ }).click();
    await expect(page.getByRole("heading", { name: "Patient directory" })).toBeVisible();
    await page.getByLabel("Search patients").fill(patientName);
    await page.getByRole("button", { name: "Apply filters" }).click();
    await page.locator(".patient-table tbody")
      .getByRole("button", { name: patientName, exact: true }).click();
    await expect(page.getByText(updatedCondition)).toBeVisible();

    persisted = await findSyntheticPatient(page, patientName);
    expect(persisted.status).toBe(200);
    expect(persisted.total).toBe(1);
    expect(persisted.patients[0]?.condition).toBe(updatedCondition);

    await page.getByRole("button", { name: "Delete patient record" }).click();
    const deleteResponsePromise = page.waitForResponse((response) =>
      apiResponse(response, "/patients/" + persisted.patients[0].id, "DELETE")
    );
    await page.getByRole("dialog", { name: "Delete this patient record?" })
      .getByRole("button", { name: "Delete permanently" }).click();
    const deleteResponse = await deleteResponsePromise;
    expect(deleteResponse.ok()).toBe(true);
    const deleted = await findSyntheticPatient(page, patientName);
    expect(deleted.status).toBe(200);
    expect(deleted.total).toBe(0);
    patientMayExist = false;

    const cookieValueForRevocationProbe = sessionCookie.value;
    await page.getByRole("button", { name: "Sign out of the administrator session" }).click();
    await expect(page.getByRole("heading", { name: "Welcome back." })).toBeVisible();
    expect((await page.context().cookies(API)).some((cookie) => cookie.name === "dt_session")).toBe(false);

    const staleSessionProbe = await request.newContext();
    try {
      const response = await staleSessionProbe.get(API + "/auth/me", {
        headers: { Cookie: "dt_session=" + cookieValueForRevocationProbe }
      });
      expect(response.status()).toBe(401);
    } finally {
      await staleSessionProbe.dispose();
    }
  } finally {
    if (patientMayExist) {
      try {
        await cleanupSyntheticPatient(page, patientName);
      } catch {
        throw new Error(
          "Staging smoke cleanup failed. Remove the synthetic record named '" +
          patientName + "' from the disposable staging database before rerunning."
        );
      }
    }
  }
});
