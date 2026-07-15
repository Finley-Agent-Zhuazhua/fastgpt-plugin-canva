import type { CanvaSecrets } from "./schemas.js";
import { CANVA_API_BASE_URL } from "./schemas.js";

export const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;

type HttpMethod = "GET" | "POST";

export function buildCanvaUrl(
  resourcePath: string,
  query: Record<string, string | undefined> = {},
): URL {
  const parsedBase = new URL(CANVA_API_BASE_URL);
  if (
    parsedBase.protocol !== "https:" ||
    parsedBase.hostname !== "api.canva.com" ||
    parsedBase.pathname !== "/rest/v1" ||
    parsedBase.port ||
    parsedBase.username ||
    parsedBase.password ||
    parsedBase.search ||
    parsedBase.hash
  ) {
    throw new Error("Canva API base URL must be the fixed https://api.canva.com/rest/v1 endpoint");
  }

  const path = resourcePath.startsWith("/") ? resourcePath : `/${resourcePath}`;
  const url = new URL(`${CANVA_API_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }
  return url;
}

export async function requestJson(
  secrets: CanvaSecrets,
  resourcePath: string,
  options: {
    method?: HttpMethod;
    query?: Record<string, string | undefined>;
    body?: unknown;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
  } = {},
): Promise<unknown> {
  const method = options.method ?? "GET";
  const timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  const url = buildCanvaUrl(resourcePath, options.query);
  const timeoutSignal = typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(timeoutMs) : undefined;
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${secrets.accessToken}`,
  };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  const requestInit: RequestInit = {
    method,
    headers,
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    ...(timeoutSignal ? { signal: timeoutSignal } : {}),
  };

  let response: Response;
  try {
    response = await fetchImpl(url, requestInit);
  } catch (error) {
    if (isTimeoutError(error)) throw new Error(`Canva request timed out after ${timeoutMs} ms`);
    throw error;
  }

  const text = await response.text();
  if (!response.ok) {
    throw createHttpError(response.status, response.statusText, text, secrets.accessToken);
  }

  let body: unknown;
  try {
    body = JSON.parse(text) as unknown;
  } catch {
    throw new Error("Canva response was not valid JSON");
  }
  if (isRecord(body) && typeof body.message === "string" && body.error) {
    throw new Error(`Canva API returned an error: ${sanitize(body.message, secrets.accessToken)}`);
  }
  return body;
}

function createHttpError(status: number, statusText: string, responseText: string, token: string): Error {
  let detail = responseText.trim();
  try {
    const parsed = JSON.parse(detail) as unknown;
    if (isRecord(parsed)) {
      const candidate = parsed.message ?? parsed.error ?? parsed.code;
      if (typeof candidate === "string") detail = candidate;
    }
  } catch {
    // Keep a bounded response for non-JSON error bodies.
  }
  return new Error(
    `Canva request failed (${status} ${statusText}): ${sanitize(detail, token).slice(0, 500) || "empty response"}`,
  );
}

function sanitize(value: string, token: string): string {
  return token ? value.split(token).join("[redacted]") : value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
}
