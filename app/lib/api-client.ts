export interface ApiErrorPayload {
  code?: string;
  message?: string;
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiMeta {
  requestId?: string;
  pagination?: ApiPagination;
}

export interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
}

export interface ApiRequestOptions extends Omit<RequestInit, "body" | "headers"> {
  body?: unknown;
  csrfToken?: string;
  headers?: HeadersInit;
}

interface ApiEnvelope<T> {
  data?: T;
  meta?: ApiMeta;
  error?: ApiErrorPayload;
}

export function getApiBaseUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!configured) return null;
  return configured.replace(/\/+$/, "");
}

export async function apiRequestWithMeta<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new ApiClientError(
      0,
      "API_NOT_CONFIGURED",
      "The API URL is not configured. Set NEXT_PUBLIC_API_BASE_URL and restart the frontend."
    );
  }

  if (process.env.NODE_ENV === "production") {
    let endpoint: URL;
    try {
      endpoint = new URL(baseUrl);
    } catch {
      throw new ApiClientError(0, "INVALID_API_URL", "The configured API URL is invalid.");
    }
    const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
    const isLocalHttpTestEndpoint = endpoint.protocol === "http:" &&
      loopbackHosts.has(endpoint.hostname.toLowerCase());
    if (endpoint.protocol !== "https:" && !isLocalHttpTestEndpoint) {
      throw new ApiClientError(0, "INSECURE_API_URL", "The API URL must use HTTPS in production.");
    }
  }

  const { body, csrfToken, headers: suppliedHeaders, ...requestOptions } = options;
  const headers = new Headers(suppliedHeaders);
  headers.set("Accept", "application/json");
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (csrfToken) headers.set("X-CSRF-Token", csrfToken);

  let response: Response;
  try {
    response = await fetch(baseUrl + path, {
      ...requestOptions,
      headers,
      credentials: "include",
      cache: "no-store",
      redirect: "error",
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiClientError(0, "NETWORK_ERROR", "The API could not be reached. Check the API URL and network connection.");
  }

  if (response.status === 204) return { data: undefined as T };

  let envelope: ApiEnvelope<T>;
  try {
    envelope = await response.json() as ApiEnvelope<T>;
  } catch {
    throw new ApiClientError(response.status, "INVALID_RESPONSE", "The API returned an unreadable response.");
  }

  if (!response.ok) {
    throw new ApiClientError(
      response.status,
      envelope.error?.code ?? "HTTP_ERROR",
      envelope.error?.message ?? "The request could not be completed."
    );
  }

  if (!("data" in envelope)) {
    throw new ApiClientError(response.status, "INVALID_RESPONSE", "The API response did not contain data.");
  }
  return { data: envelope.data as T, meta: envelope.meta };
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const result = await apiRequestWithMeta<T>(path, options);
  return result.data;
}
