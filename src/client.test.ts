import { afterEach, describe, expect, it, vi } from "vitest";
import { buildCanvaUrl, requestJson } from "./client";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Canva client", () => {
  it("builds a fixed-host list request with query parameters and bearer auth", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ items: [] }));
    await expect(requestJson({ accessToken: "test-token" }, "/designs", {
      query: { query: "summer poster", ownership: "owned", sort_by: "title_ascending" },
      timeoutMs: 30_000,
      fetchImpl: fetchMock,
    })).resolves.toEqual({ items: [] });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    const parsed = new URL(String(url));
    expect(`${parsed.origin}${parsed.pathname}`).toBe("https://api.canva.com/rest/v1/designs");
    expect(parsed.searchParams.get("query")).toBe("summer poster");
    expect(parsed.searchParams.get("ownership")).toBe("owned");
    expect(parsed.searchParams.get("sort_by")).toBe("title_ascending");
    expect(init?.method).toBe("GET");
    expect((init?.headers as Record<string, string>).Authorization).toBe("Bearer test-token");
    expect((init?.headers as Record<string, string>).Accept).toBe("application/json");
  });

  it("serializes JSON POST bodies without putting the token in the body", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ job: { id: "job-1" } }));
    await requestJson({ accessToken: "secret-token" }, "/exports", {
      method: "POST",
      body: { design_id: "design-1", format: { type: "pdf" } },
      fetchImpl: fetchMock,
    });

    const init = fetchMock.mock.calls[0]?.[1];
    expect(init?.method).toBe("POST");
    expect(JSON.parse(String(init?.body))).toEqual({ design_id: "design-1", format: { type: "pdf" } });
    expect(String(init?.body)).not.toContain("secret-token");
    expect((init?.headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("redacts tokens in HTTP errors and rejects malformed JSON", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ message: "token secret-token is invalid" }, 401))
      .mockResolvedValueOnce(new Response("not-json", { status: 200 }));
    const secrets = { accessToken: "secret-token" };

    await expect(requestJson(secrets, "/users/me", { fetchImpl: fetchMock }))
      .rejects.toThrow("token [redacted] is invalid");
    await expect(requestJson(secrets, "/users/me", { fetchImpl: fetchMock }))
      .rejects.toThrow("not valid JSON");
    expect(buildCanvaUrl("/users/me").origin).toBe("https://api.canva.com");
  });
});
