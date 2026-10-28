import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parsePublicHttpsUrl } from "./deployment-preflight.mjs";

export const STAGING_CONFIRMATION = "I_CONFIRM_DISPOSABLE_STAGING";

const STAGING_HOST_LABELS = new Set(["stage", "staging", "stg", "preview", "test"]);

function hasStagingHostLabel(hostname) {
  return hostname
    .toLowerCase()
    .split(/[.-]/)
    .some((label) => STAGING_HOST_LABELS.has(label));
}

export function validateStagingSmokeTarget({
  frontendUrl,
  apiBaseUrl,
  doctorId,
  confirmation
}) {
  if (confirmation !== STAGING_CONFIRMATION) {
    throw new Error(
      "Confirmation is required: type " + STAGING_CONFIRMATION +
      " only for a disposable staging environment."
    );
  }

  const frontend = parsePublicHttpsUrl(frontendUrl, "Frontend URL");
  const api = parsePublicHttpsUrl(apiBaseUrl, "API base URL", { requireApiBase: true });

  if (!hasStagingHostLabel(frontend.hostname)) {
    throw new Error(
      "Frontend hostname must include an explicit staging, stage, stg, preview, or test label."
    );
  }
  if (!hasStagingHostLabel(api.hostname)) {
    throw new Error(
      "API hostname must include an explicit staging, stage, stg, preview, or test label."
    );
  }
  if (typeof doctorId !== "string" || !/^[a-f\d]{24}$/i.test(doctorId.trim())) {
    throw new Error("A valid 24-character synthetic staging doctor ID is required.");
  }

  return {
    frontendHost: frontend.hostname,
    apiHost: api.hostname,
    doctorId: doctorId.trim()
  };
}

function main() {
  try {
    const target = validateStagingSmokeTarget({
      frontendUrl: process.env.FRONTEND_URL,
      apiBaseUrl: process.env.API_BASE_URL,
      doctorId: process.env.STAGING_DOCTOR_ID,
      confirmation: process.env.CONFIRM_STAGING_TARGET
    });

    process.stdout.write(
      "Staging target accepted: frontend host " + target.frontendHost +
      ", API host " + target.apiHost +
      "; synthetic doctor fixture configured.\n"
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid staging target.";
    process.stderr.write("Staging smoke guard rejected target: " + message + "\n");
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
