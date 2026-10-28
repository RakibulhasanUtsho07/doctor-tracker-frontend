import assert from "node:assert/strict";
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
      frontendUrl: "https://doctor-tracker.acme.io"
    })),
    /Frontend hostname must include/
  );
  assert.throws(
    () => validateStagingSmokeTarget(validTarget({
      apiBaseUrl: "https://api.acme.io/api/v1"
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
