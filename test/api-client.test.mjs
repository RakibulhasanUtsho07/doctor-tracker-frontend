import assert from "node:assert/strict";
import test from "node:test";

process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000/api/v1";
const { ApiClientError, apiRequest, getApiBaseUrl } = await import("../app/lib/api-client.ts");

test("API requests include credentials and unwrap the documented response envelope", async () => {
  const originalFetch = globalThis.fetch;
  let capturedUrl = "";
  let capturedInit;
  globalThis.fetch = async (url, init) => {
    capturedUrl = String(url);
    capturedInit = init;
    return new Response(JSON.stringify({ data: { user: { email: "admin@example.com" } }, meta: { requestId: "test" } }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };

  try {
    const result = await apiRequest("/auth/me");
    assert.equal(capturedUrl, "http://localhost:4000/api/v1/auth/me");
    assert.equal(capturedInit.credentials, "include");
    assert.equal(capturedInit.cache, "no-store");
    assert.equal(result.user.email, "admin@example.com");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("mutating requests serialize JSON and attach the in-memory CSRF token", async () => {
  const originalFetch = globalThis.fetch;
  let capturedInit;
  globalThis.fetch = async (_url, init) => {
    capturedInit = init;
    return new Response(JSON.stringify({ data: { ok: true } }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };

  try {
    const result = await apiRequest("/auth/login", {
      method: "POST",
      body: { email: "admin@example.com", password: "not-a-real-password" },
      csrfToken: "csrf-test-token"
    });
    assert.equal(capturedInit.headers.get("Content-Type"), "application/json");
    assert.equal(capturedInit.headers.get("X-CSRF-Token"), "csrf-test-token");
    assert.deepEqual(JSON.parse(capturedInit.body), { email: "admin@example.com", password: "not-a-real-password" });
    assert.equal(result.ok, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("API errors preserve status and documented error code without logging request data", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    error: { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect." },
    meta: { requestId: "test" }
  }), { status: 401, headers: { "Content-Type": "application/json" } });

  try {
    await assert.rejects(
      apiRequest("/auth/login", { method: "POST", body: { email: "admin@example.com", password: "not-a-real-password" } }),
      (error) => error instanceof ApiClientError && error.status === 401 && error.code === "INVALID_CREDENTIALS"
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("204 responses resolve without attempting to parse a JSON body", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(null, { status: 204 });
  try {
    assert.equal(await apiRequest("/auth/logout", { method: "POST", csrfToken: "csrf" }), undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("API base URL is normalized and can be explicitly absent", () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = " http://localhost:4000/api/v1/// ";
  assert.equal(getApiBaseUrl(), "http://localhost:4000/api/v1");
  delete process.env.NEXT_PUBLIC_API_BASE_URL;
  assert.equal(getApiBaseUrl(), null);
});
