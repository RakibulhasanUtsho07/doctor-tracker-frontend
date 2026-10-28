import assert from "node:assert/strict";
import test from "node:test";

process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000/api/v1";
const { ApiClientError, apiRequest, apiRequestWithMeta, getApiBaseUrl } = await import("../app/lib/api-client.ts");

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
    assert.equal(capturedInit.redirect, "error");
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


test("metadata-aware API requests preserve pagination metadata without changing data-only callers", async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000/api/v1";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    data: { doctors: [{ id: "doctor-1", name: "Synthetic Doctor" }] },
    meta: { requestId: "req-123", pagination: { page: 2, limit: 10, total: 23, totalPages: 3 } }
  }), { status: 200, headers: { "Content-Type": "application/json" } });

  try {
    const result = await apiRequestWithMeta("/doctors?page=2&limit=10");
    assert.equal(result.data.doctors.length, 1);
    assert.equal(result.meta.requestId, "req-123");
    assert.deepEqual(result.meta.pagination, { page: 2, limit: 10, total: 23, totalPages: 3 });
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test("doctor duplicate-email conflicts preserve their HTTP status and safe error code", async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000/api/v1";
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(JSON.stringify({
    error: { code: "DOCTOR_EMAIL_EXISTS", message: "A doctor with this email already exists." },
    meta: { requestId: "duplicate-test" }
  }), { status: 409, headers: { "Content-Type": "application/json" } });

  try {
    await assert.rejects(
      apiRequest("/doctors", {
        method: "POST",
        body: { name: "Synthetic Doctor", email: "doctor@example.com" },
        csrfToken: "csrf-test-token"
      }),
      (error) => error instanceof ApiClientError &&
        error.status === 409 &&
        error.code === "DOCTOR_EMAIL_EXISTS" &&
        error.message === "A doctor with this email already exists."
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});


test("patient delete and doctor detachment are credentialed CSRF-protected no-content requests", async () => {
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://localhost:4000/api/v1";
  const originalFetch = globalThis.fetch;
  const captured = [];
  globalThis.fetch = async (url, init) => {
    captured.push({ url: String(url), method: init.method, credentials: init.credentials, csrf: init.headers.get("X-CSRF-Token") });
    return new Response(null, { status: 204 });
  };

  try {
    const csrfToken = "patient-action-csrf-token";
    assert.equal(await apiRequest("/patients/111111111111111111111111", { method: "DELETE", csrfToken }), undefined);
    assert.equal(await apiRequest("/doctors/222222222222222222222222/patients/111111111111111111111111", {
      method: "DELETE",
      csrfToken
    }), undefined);
    assert.deepEqual(captured, [
      {
        url: "http://localhost:4000/api/v1/patients/111111111111111111111111",
        method: "DELETE",
        credentials: "include",
        csrf: csrfToken
      },
      {
        url: "http://localhost:4000/api/v1/doctors/222222222222222222222222/patients/111111111111111111111111",
        method: "DELETE",
        credentials: "include",
        csrf: csrfToken
      }
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("production API calls reject insecure HTTP endpoints before sending credentials", async () => {
  const originalFetch = globalThis.fetch;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return new Response(JSON.stringify({ data: {} }), { status: 200 });
  };
  process.env.NODE_ENV = "production";
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://api.example.com/api/v1";

  try {
    await assert.rejects(
      apiRequest("/auth/me"),
      (error) => error instanceof ApiClientError &&
        error.code === "INSECURE_API_URL" &&
        error.message === "The API URL must use HTTPS in production."
    );
    assert.equal(fetchCalled, false, "the client must fail closed before sending cookies or request data");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalApiBaseUrl === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL;
    else process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBaseUrl;
  }
});

test("production-mode browser harness may use HTTP only for a loopback API", async () => {
  const originalFetch = globalThis.fetch;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  let capturedUrl = "";
  let capturedInit;
  globalThis.fetch = async (url, init) => {
    capturedUrl = String(url);
    capturedInit = init;
    return new Response(JSON.stringify({ data: { ok: true } }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };
  process.env.NODE_ENV = "production";
  process.env.NEXT_PUBLIC_API_BASE_URL = "http://127.0.0.1:4000/api/v1";

  try {
    assert.deepEqual(await apiRequest("/auth/me"), { ok: true });
    assert.equal(capturedUrl, "http://127.0.0.1:4000/api/v1/auth/me");
    assert.equal(capturedInit.credentials, "include");
    assert.equal(capturedInit.redirect, "error");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalApiBaseUrl === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL;
    else process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBaseUrl;
  }
});

test("production API calls accept HTTPS endpoints and disallow automatic redirects", async () => {
  const originalFetch = globalThis.fetch;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  let capturedUrl = "";
  let capturedInit;
  globalThis.fetch = async (url, init) => {
    capturedUrl = String(url);
    capturedInit = init;
    return new Response(JSON.stringify({ data: { ok: true } }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  };
  process.env.NODE_ENV = "production";
  process.env.NEXT_PUBLIC_API_BASE_URL = "https://api.example.com/api/v1";

  try {
    assert.deepEqual(await apiRequest("/auth/me"), { ok: true });
    assert.equal(capturedUrl, "https://api.example.com/api/v1/auth/me");
    assert.equal(capturedInit.credentials, "include");
    assert.equal(capturedInit.redirect, "error");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalApiBaseUrl === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL;
    else process.env.NEXT_PUBLIC_API_BASE_URL = originalApiBaseUrl;
  }
});
