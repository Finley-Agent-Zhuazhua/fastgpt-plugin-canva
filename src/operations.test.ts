import { afterEach, describe, expect, it, vi } from "vitest";
import { createDesign, exportDesign, getExportJob, listDesigns } from "./operations";

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Canva operations", () => {
  it("parses and limits design search results", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({
      items: [
        { id: "design-1", title: "Spring" },
        { id: "design-2", title: "Summer" },
        { id: "design-3", title: "Autumn" },
      ],
      continuation: "next-page",
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listDesigns({
      accessToken: "test-token",
      query: "season",
      ownership: "owned",
      sortBy: "modified_descending",
      limit: 2,
      timeoutMs: 30_000,
    })).resolves.toEqual({
      success: true,
      data: {
        items: [
          { id: "design-1", title: "Spring" },
          { id: "design-2", title: "Summer" },
        ],
        continuation: "next-page",
      },
    });

    const parsed = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(parsed.pathname).toBe("/rest/v1/designs");
    expect(parsed.searchParams.get("query")).toBe("season");
    expect(parsed.searchParams.get("ownership")).toBe("owned");
  });

  it("creates custom designs and starts export jobs", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ design: { id: "design-9", title: "Campaign" } }))
      .mockResolvedValueOnce(jsonResponse({ job: { id: "job-9", status: "in_progress" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(createDesign({
      accessToken: "test-token",
      designType: "custom",
      width: 1080,
      height: 1080,
      title: "Campaign",
      timeoutMs: 30_000,
    })).resolves.toEqual({
      success: true,
      data: { id: "design-9", title: "Campaign" },
    });
    await expect(exportDesign({
      accessToken: "test-token",
      designId: "design-9",
      format: "png",
      exportQuality: "regular",
      pages: [1, 2],
      timeoutMs: 30_000,
    })).resolves.toEqual({
      success: true,
      data: { id: "job-9", status: "in_progress" },
    });

    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      design_type: { type: "custom", width: 1080, height: 1080 },
      title: "Campaign",
    });
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual({
      design_id: "design-9",
      format: { type: "png", export_quality: "regular", pages: [1, 2] },
    });
  });

  it("reads an export job and reports malformed API envelopes", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ job: { id: "job-1", status: "success", urls: ["https://download.example/file"] } }))
      .mockResolvedValueOnce(jsonResponse({ items: [] }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getExportJob({
      accessToken: "test-token",
      jobId: "job-1",
      timeoutMs: 30_000,
    })).resolves.toEqual({
      success: true,
      data: { id: "job-1", status: "success", urls: ["https://download.example/file"] },
    });
    await expect(listDesigns({
      accessToken: "test-token",
      ownership: "any",
      sortBy: "modified_descending",
      limit: 20,
      timeoutMs: 30_000,
    })).resolves.toEqual({ success: true, data: { items: [] } });
  });
});
