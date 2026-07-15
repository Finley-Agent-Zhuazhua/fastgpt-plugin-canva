import type {
  InputSchemaMetaType,
  OutputSchemaMetaType,
  SecretSchemaMetaType,
} from "@fastgpt-plugin/sdk-factory";
import z from "zod";

export const CANVA_API_BASE_URL = "https://api.canva.com/rest/v1";

const timeoutSchema = z.number().int().min(1000).max(120000).default(30000).meta({
  title: "Timeout (ms)",
  description: "Maximum time to wait for a Canva API request.",
  toolDescription: "Request timeout in milliseconds, from 1,000 to 120,000.",
} satisfies InputSchemaMetaType);

const designIdSchema = z.string().trim().min(1).max(200).meta({
  title: "Design ID",
  description: "The Canva design ID, not the full edit URL.",
  toolDescription: "A Canva design identifier such as DAE... . Use listDesigns when you only know a title or keyword.",
} satisfies InputSchemaMetaType);

export const canvaSecretSchema = z.object({
  accessToken: z.string().trim().min(1).max(4096).meta({
    title: "Canva access token",
    description: "OAuth access token issued by a Canva Connect integration.",
    isSecret: true,
  } satisfies SecretSchemaMetaType),
});

export const listDesignsInputSchema = z.object({
  query: z.string().trim().max(200).optional().meta({
    title: "Search query",
    description: "Optional keywords to search the authenticated Canva design library. Omit to list designs.",
  } satisfies InputSchemaMetaType),
  ownership: z.enum(["any", "owned", "shared"]).default("any").meta({
    title: "Ownership",
    description: "Limit results to designs owned by the user or shared with the user.",
  } satisfies InputSchemaMetaType),
  sortBy: z.enum([
    "modified_descending",
    "relevance",
    "modified_ascending",
    "title_ascending",
    "title_descending",
  ]).default("modified_descending").meta({
    title: "Sort by",
    description: "Ordering for the Canva design search results.",
  } satisfies InputSchemaMetaType),
  continuation: z.string().trim().max(4096).optional().meta({
    title: "Continuation token",
    description: "Token returned by a previous call to retrieve the next result page.",
  } satisfies InputSchemaMetaType),
  limit: z.number().int().min(1).max(100).default(20).meta({
    title: "Result limit",
    description: "Maximum number of designs to return, from 1 to 100.",
  } satisfies InputSchemaMetaType),
  timeoutMs: timeoutSchema,
});

export const getDesignInputSchema = z.object({
  designId: designIdSchema,
  timeoutMs: timeoutSchema,
});

export const createDesignInputSchema = z.object({
  designType: z.enum(["doc", "whiteboard", "presentation", "custom"]).default("presentation").meta({
    title: "Design type",
    description: "A Canva preset type, or custom for explicit pixel dimensions.",
  } satisfies InputSchemaMetaType),
  width: z.number().int().min(40).max(8000).optional().meta({
    title: "Custom width",
    description: "Custom design width in pixels. Required with custom design type.",
  } satisfies InputSchemaMetaType),
  height: z.number().int().min(40).max(8000).optional().meta({
    title: "Custom height",
    description: "Custom design height in pixels. Required with custom design type.",
  } satisfies InputSchemaMetaType),
  title: z.string().trim().min(1).max(255).optional().meta({
    title: "Design title",
    description: "Optional title for the new design.",
  } satisfies InputSchemaMetaType),
  timeoutMs: timeoutSchema,
});

export const exportDesignInputSchema = z.object({
  designId: designIdSchema,
  format: z.enum(["pdf", "jpg", "png", "pptx"]).default("pdf").meta({
    title: "Export format",
    description: "Output format for the asynchronous Canva export job.",
  } satisfies InputSchemaMetaType),
  exportQuality: z.enum(["regular", "pro"]).optional().meta({
    title: "Export quality",
    description: "Optional Canva export quality; availability depends on the account and design.",
  } satisfies InputSchemaMetaType),
  pages: z.array(z.number().int().min(1).max(10000)).max(1000).optional().meta({
    title: "Pages",
    description: "Optional 1-based page numbers to export. Omit to export all pages.",
  } satisfies InputSchemaMetaType),
  timeoutMs: timeoutSchema,
});

export const getExportJobInputSchema = z.object({
  jobId: z.string().trim().min(1).max(200).meta({
    title: "Export job ID",
    description: "The asynchronous export job ID returned by exportDesign.",
  } satisfies InputSchemaMetaType),
  timeoutMs: timeoutSchema,
});

const dataOutputSchema = z.object({
  success: z.literal(true).meta({ title: "Success" } satisfies OutputSchemaMetaType),
  data: z.unknown().meta({
    title: "Canva response",
    description: "Structured data returned by the Canva Connect API.",
  } satisfies OutputSchemaMetaType),
});

export const listDesignsOutputSchema = dataOutputSchema;
export const getDesignOutputSchema = dataOutputSchema;
export const createDesignOutputSchema = dataOutputSchema;
export const exportDesignOutputSchema = dataOutputSchema;
export const getExportJobOutputSchema = dataOutputSchema;

export type CanvaSecrets = z.output<typeof canvaSecretSchema>;
export type ListDesignsInput = z.output<typeof listDesignsInputSchema>;
export type GetDesignInput = z.output<typeof getDesignInputSchema>;
export type CreateDesignInput = z.output<typeof createDesignInputSchema>;
export type ExportDesignInput = z.output<typeof exportDesignInputSchema>;
export type GetExportJobInput = z.output<typeof getExportJobInputSchema>;
