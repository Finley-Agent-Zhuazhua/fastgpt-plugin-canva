import { createToolHandler, defineToolSet } from "@fastgpt-plugin/sdk-factory";
import {
  canvaSecretSchema,
  createDesignInputSchema,
  createDesignOutputSchema,
  exportDesignInputSchema,
  exportDesignOutputSchema,
  getDesignInputSchema,
  getDesignOutputSchema,
  getExportJobInputSchema,
  getExportJobOutputSchema,
  listDesignsInputSchema,
  listDesignsOutputSchema,
  type CanvaSecrets,
} from "./src/schemas.js";
import { createDesign, exportDesign, getDesign, getExportJob, listDesigns } from "./src/operations.js";

function requireSecrets(secrets: CanvaSecrets | undefined): CanvaSecrets {
  if (!secrets?.accessToken?.trim()) throw new Error("Canva accessToken secret is required");
  return { accessToken: secrets.accessToken.trim() };
}

const listDesignsHandler = createToolHandler({
  inputSchema: listDesignsInputSchema,
  outputSchema: listDesignsOutputSchema,
  secretSchema: canvaSecretSchema,
  handler: async (input, ctx) => listDesigns({ ...input, ...requireSecrets(ctx.secrets) }),
});

const getDesignHandler = createToolHandler({
  inputSchema: getDesignInputSchema,
  outputSchema: getDesignOutputSchema,
  secretSchema: canvaSecretSchema,
  handler: async (input, ctx) => getDesign({ ...input, ...requireSecrets(ctx.secrets) }),
});

const createDesignHandler = createToolHandler({
  inputSchema: createDesignInputSchema,
  outputSchema: createDesignOutputSchema,
  secretSchema: canvaSecretSchema,
  handler: async (input, ctx) => createDesign({ ...input, ...requireSecrets(ctx.secrets) }),
});

const exportDesignHandler = createToolHandler({
  inputSchema: exportDesignInputSchema,
  outputSchema: exportDesignOutputSchema,
  secretSchema: canvaSecretSchema,
  handler: async (input, ctx) => exportDesign({ ...input, ...requireSecrets(ctx.secrets) }),
});

const getExportJobHandler = createToolHandler({
  inputSchema: getExportJobInputSchema,
  outputSchema: getExportJobOutputSchema,
  secretSchema: canvaSecretSchema,
  handler: async (input, ctx) => getExportJob({ ...input, ...requireSecrets(ctx.secrets) }),
});

export default defineToolSet({
  manifest: {
    pluginId: "canva",
    name: { en: "Canva", "zh-CN": "Canva 设计自动化" },
    description: {
      en: "Discover, create, and export Canva designs for marketing and content workflows.",
      "zh-CN": "发现、创建和导出 Canva 设计，适用于营销内容和素材自动化工作流。",
    },
    version: "0.1.0",
    versionDescription: {
      en: "Initial Canva Connect API toolset for design discovery, creation, and asynchronous export.",
      "zh-CN": "初始版本，支持设计搜索、创建和异步导出。",
    },
    toolDescription: "Uses the fixed Canva Connect REST API endpoint. Store the OAuth access token as a secret; it is sent only as a Bearer token and never returned in tool output.",
    tutorialUrl: "https://www.canva.dev/docs/connect/",
    tags: ["tools", "productivity", "design"],
    permission: [],
  },
  secretSchema: canvaSecretSchema,
  children: [
    {
      id: "listDesigns",
      name: { en: "List Designs", "zh-CN": "搜索设计" },
      description: { en: "Search or list designs in the authenticated Canva library.", "zh-CN": "搜索或列出当前 Canva 账号中的设计。" },
      toolDescription: "Use keywords, ownership, sorting, and continuation tokens to discover design IDs before other operations.",
      handler: listDesignsHandler,
    },
    {
      id: "getDesign",
      name: { en: "Get Design", "zh-CN": "读取设计" },
      description: { en: "Read metadata, links, and thumbnail information for a Canva design.", "zh-CN": "读取 Canva 设计的元数据、链接和缩略图信息。" },
      toolDescription: "Fetch one Canva design by ID. Use listDesigns first when only a title or keyword is known.",
      handler: getDesignHandler,
    },
    {
      id: "createDesign",
      name: { en: "Create Design", "zh-CN": "创建设计" },
      description: { en: "Create a Canva preset or custom-size design.", "zh-CN": "创建 Canva 预设类型或自定义尺寸的设计。" },
      toolDescription: "Create a new blank Canva design for a marketing or content workflow. Each call creates a new design.",
      handler: createDesignHandler,
    },
    {
      id: "exportDesign",
      name: { en: "Export Design", "zh-CN": "导出设计" },
      description: { en: "Start an asynchronous PDF, image, or PowerPoint export job.", "zh-CN": "启动异步 PDF、图片或 PowerPoint 导出任务。" },
      toolDescription: "Start a Canva export job. The returned job must be polled with getExportJob; completed download URLs are temporary.",
      handler: exportDesignHandler,
    },
    {
      id: "getExportJob",
      name: { en: "Get Export Job", "zh-CN": "查询导出任务" },
      description: { en: "Poll a Canva export job and retrieve completed download URLs.", "zh-CN": "查询 Canva 导出任务并获取完成后的临时下载链接。" },
      toolDescription: "Retrieve the status and result of an export job returned by exportDesign.",
      handler: getExportJobHandler,
    },
  ],
});
