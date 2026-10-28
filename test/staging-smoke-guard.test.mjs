import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  STAGING_CONFIRMATION,
  validateStagingSmokeTarget
} from "../scripts/staging-smoke-guard.mjs";

const doctorId = "65f0a12b34c567d890123456";

function validTarget(overrides = {}) {
  return {
    frontendUrl: "https://frontend-staging.acme.io",
    apiBaseUrl: "https://api-preview.acme.io/api/v1",
    doctorId,
    confirmation: STAGING_CONFIRMATION,
    expectedFrontendHost: "frontend-staging.acme.io",
    expectedApiHost: "api-preview.acme.io",
    ...overrides
  };
}

test("accepts explicit HTTPS staging targets with a synthetic doctor fixture", () => {
  assert.deepEqual(validateStagingSmokeTarget(validTarget()), {
    frontendHost: "frontend-staging.acme.io",
    apiHost: "api-preview.acme.io",
    doctorId
  });
});

test("rejects a missing disposable-staging confirmation", () => {
  assert.throws(
    () => validateStagingSmokeTarget(validTarget({ confirmation: "yes" })),
    /Confirmation is required/
  );
});

test("rejects hostnames without an explicit staging marker", () => {
  assert.throws(
    () => validateStagingSmokeTarget(validTarget({
      frontendUrl: "https://doctor-tracker.acme.io",
      expectedFrontendHost: "doctor-tracker.acme.io"
    })),
    /Frontend hostname must include/
  );
  assert.throws(
    () => validateStagingSmokeTarget(validTarget({
      apiBaseUrl: "https://api.acme.io/api/v1",
      expectedApiHost: "api.acme.io"
    })),
    /API hostname must include/
  );
});

test("rejects insecure, malformed, or non-versioned endpoints", () => {
  assert.throws(
    () => validateStagingSmokeTarget(validTarget({
      frontendUrl: "http://frontend-staging.acme.io"
    })),
    /must use HTTPS/
  );
  assert.throws(
    () => validateStagingSmokeTarget(validTarget({
      apiBaseUrl: "https://api-preview.acme.io"
    })),
    /must end with \/api\/v1/
  );
});

test("rejects a non-MongoDB object identifier for the staging fixture", () => {
  assert.throws(
    () => validateStagingSmokeTarget(validTarget({ doctorId: "not-a-doctor-id" })),
    /24-character synthetic staging doctor ID/
  );
});

test("requires trusted repository host allowlists before staging acceptance", () => {
  assert.throws(
    () => validateStagingSmokeTarget(validTarget({ expectedFrontendHost: "" })),
    /STAGING_FRONTEND_HOST repository variable must be configured/
  );
  assert.throws(
    () => validateStagingSmokeTarget(validTarget({ expectedApiHost: undefined })),
    /STAGING_API_HOST repository variable must be configured/
  );
  assert.throws(
    () => validateStagingSmokeTarget(validTarget({ expectedFrontendHost: "https://frontend-staging.acme.io" })),
    /must be a DNS hostname only/
  );
});

test("rejects staging-looking attacker-controlled hosts that do not match the trusted allowlist", () => {
  assert.throws(
    () => validateStagingSmokeTarget(validTarget({
      frontendUrl: "https://staging.attacker-acme.io",
      expectedFrontendHost: "frontend-staging.acme.io"
    })),
    /must exactly match the configured STAGING_FRONTEND_HOST/
  );
  assert.throws(
    () => validateStagingSmokeTarget(validTarget({
      apiBaseUrl: "https://api-staging.attacker-acme.io/api/v1",
      expectedApiHost: "api-preview.acme.io"
    })),
    /must exactly match the configured STAGING_API_HOST/
  );
});

test("host allowlists are case-canonical DNS hostnames", () => {
  assert.throws(
    () => validateStagingSmokeTarget(validTarget({ expectedFrontendHost: "Frontend-Staging.acme.io" })),
    /must be a DNS hostname only/
  );
});


test("mutating staging workflow uses a protected environment and only trusted deployment branches", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/staging-smoke.yml", import.meta.url),
    "utf8"
  );

  assert.match(
    workflow,
    /^    if: github\\.ref == 'refs\\/heads\\/dev' \\|\\| github\\.ref == 'refs\\/heads\\/main'$/m
  );
  assert.match(workflow, /^    environment:$/m);
  assert.match(workflow, /^      name: disposable-staging$/m);
  assert.match(workflow, /^      url: \\$\\{\\{ inputs\\.frontend_url \\}\\}$/m);
  assert.match(
    workflow,
    /STAGING_ADMIN_EMAIL: \\$\\{\\{ secrets\\.STAGING_ADMIN_EMAIL \\}\\}/
  );
  assert.match(
    workflow,
    /STAGING_ADMIN_PASSWORD: \\$\\{\\{ secrets\\.STAGING_ADMIN_PASSWORD \\}\\}/
  );
});
