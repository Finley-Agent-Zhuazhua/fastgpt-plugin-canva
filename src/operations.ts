import { requestJson } from "./client.js";
import type {
  CanvaSecrets,
  CreateDesignInput,
  ExportDesignInput,
  GetDesignInput,
  GetExportJobInput,
  ListDesignsInput,
} from "./schemas.js";

type WithSecrets<T> = T & CanvaSecrets;

export async function listDesigns(input: WithSecrets<ListDesignsInput>): Promise<{ success: true; data: unknown }> {
  const response = await requestJson(input, "/designs", {
    method: "GET",
    query: {
      query: input.query,
      ownership: input.ownership === "any" ? undefined : input.ownership,
      sort_by: input.sortBy,
      continuation: input.continuation,
    },
    timeoutMs: input.timeoutMs,
  });
  if (!isRecord(response) || !Array.isArray(response.items)) {
    throw new Error("Canva designs response did not contain an items array");
  }
  const data: Record<string, unknown> = { items: response.items };
  if (typeof response.continuation === "string") data.continuation = response.continuation;
  return { success: true, data: { ...data, items: response.items.slice(0, input.limit) } };
}

export async function getDesign(input: WithSecrets<GetDesignInput>): Promise<{ success: true; data: unknown }> {
  const response = await requestJson(input, `/designs/${encodeURIComponent(input.designId)}`, {
    timeoutMs: input.timeoutMs,
  });
  if (!isRecord(response) || !("design" in response)) {
    throw new Error("Canva design response did not contain a design object");
  }
  return { success: true, data: response.design };
}

export async function createDesign(input: WithSecrets<CreateDesignInput>): Promise<{ success: true; data: unknown }> {
  const body: Record<string, unknown> = {};
  if (input.designType === "custom") {
    if (input.width === undefined || input.height === undefined) {
      throw new Error("width and height are required for a custom Canva design");
    }
    body.design_type = { type: "custom", width: input.width, height: input.height };
  } else {
    body.design_type = { type: "preset", name: input.designType };
  }
  if (input.title !== undefined) body.title = input.title;

  const response = await requestJson(input, "/designs", {
    method: "POST",
    body,
    timeoutMs: input.timeoutMs,
  });
  if (!isRecord(response) || !("design" in response)) {
    throw new Error("Canva create design response did not contain a design object");
  }
  return { success: true, data: response.design };
}

export async function exportDesign(input: WithSecrets<ExportDesignInput>): Promise<{ success: true; data: unknown }> {
  const format: Record<string, unknown> = { type: input.format };
  if (input.exportQuality !== undefined) format.export_quality = input.exportQuality;
  if (input.pages !== undefined && input.pages.length > 0) format.pages = input.pages;

  const response = await requestJson(input, "/exports", {
    method: "POST",
    body: { design_id: input.designId, format },
    timeoutMs: input.timeoutMs,
  });
  if (!isRecord(response) || !("job" in response)) {
    throw new Error("Canva export response did not contain a job object");
  }
  return { success: true, data: response.job };
}

export async function getExportJob(input: WithSecrets<GetExportJobInput>): Promise<{ success: true; data: unknown }> {
  const response = await requestJson(input, `/exports/${encodeURIComponent(input.jobId)}`, {
    timeoutMs: input.timeoutMs,
  });
  if (!isRecord(response) || !("job" in response)) {
    throw new Error("Canva export job response did not contain a job object");
  }
  return { success: true, data: response.job };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
