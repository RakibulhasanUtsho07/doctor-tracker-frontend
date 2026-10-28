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

  assert.ok(
    workflow.includes("if: github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/dev'"),
    "mutating staging acceptance must be manual-only and restricted to dev"
  );
  assert.ok(
    workflow.includes("if: github.event_name == 'push' || github.ref != 'refs/heads/dev'"),
    "pushes and wrong-ref manual dispatches must use the non-mutating validation job"
  );
  assert.ok(workflow.includes("node --test test/staging-smoke-guard.test.mjs"));
  assert.ok(workflow.includes("this run made no staging requests and accessed no staging secrets."));
  assert.ok(workflow.includes("environment:"));
  assert.ok(workflow.includes("name: disposable-staging"));
  assert.equal(
    [...workflow.matchAll(/^    runs-on: ubuntu-latest$/gm)].length,
    2,
    "both jobs must declare runs-on at the job level"
  );
  assert.doesNotMatch(
    workflow,
    /^ {6,}runs-on:/m,
    "runs-on must not be accidentally nested inside job configuration"
  );
  assert.ok(
    !workflow.includes("url: ${{ inputs.frontend_url }}"),
    "unvalidated caller-controlled URLs must not be published as deployment links before environment approval"
  );
  const actionReferences = [...workflow.matchAll(/^\s+uses:\s+(\S+)/gm)].map((match) => match[1]);
  assert.ok(actionReferences.length > 0, "staging workflow must include its required actions");
  assert.ok(
    actionReferences.every((reference) => /^[^@]+@[a-f\d]{40}$/i.test(reference)),
    "external GitHub Actions must be pinned to immutable full commit SHAs"
  );
  const guardIndex = workflow.indexOf("run: node scripts/staging-smoke-guard.mjs");
  const secretsIndex = workflow.indexOf("Require staging-only test administrator secrets");
  const preflightIndex = workflow.indexOf("run: node scripts/deployment-preflight.mjs");
  const mutationIndex = workflow.indexOf("Run deployed staging browser acceptance");
  assert.ok(
    guardIndex >= 0 && secretsIndex > guardIndex && preflightIndex > secretsIndex && mutationIndex > preflightIndex,
    "target allowlist guard, then environment secrets, then deployment preflight must precede mutating browser acceptance"
  );
  assert.ok(workflow.includes("STAGING_ADMIN_EMAIL: ${{ secrets.STAGING_ADMIN_EMAIL }}"));
  assert.ok(workflow.includes("STAGING_ADMIN_PASSWORD: ${{ secrets.STAGING_ADMIN_PASSWORD }}"));
});

test("frontend CI workflow pins every external action to an immutable commit SHA", async () => {
  const workflow = await readFile(
    new URL("../.github/workflows/frontend-ci.yml", import.meta.url),
    "utf8"
  );
  const actionReferences = [...workflow.matchAll(/^\s+uses:\s+(\S+)/gm)].map((match) => match[1]);
  assert.equal(actionReferences.length, 3, "expected the three reviewed frontend CI actions");
  assert.ok(
    actionReferences.every((reference) => /^[^@]+@[a-f\d]{40}$/i.test(reference)),
    "frontend CI external actions must be pinned to immutable full commit SHAs"
  );
});

test("arms synthetic patient cleanup before the create request can mutate staging", async () => {
  const smoke = await readFile(
    new URL("../e2e/staging-smoke.spec.mjs", import.meta.url),
    "utf8"
  );
  const cleanupArm = smoke.indexOf("patientMayExist = true;");
  const createRequest = smoke.indexOf('getByRole("button", { name: "Create patient" }).click()');
  assert.ok(
    cleanupArm >= 0 && createRequest > cleanupArm,
    "cleanup must be armed before attempting patient creation so an ambiguous request failure cannot silently orphan a synthetic record"
  );
  assert.ok(smoke.includes("if (patientMayExist)"), "the failure path must attempt cleanup");
});

