# FastGPT Canva Plugin

Canva Connect API 工具集，用于把设计库发现、营销素材创建设计和异步导出接入 FastGPT。

## 工具

- `listDesigns`：按关键词、归属和排序搜索 Canva 设计，返回设计 ID 与 continuation token。
- `getDesign`：读取设计标题、所有者、编辑/查看链接、缩略图和页数等元数据。
- `createDesign`：创建文档、白板、演示文稿等预设设计，或创建 40–8000 像素的自定义尺寸设计。
- `exportDesign`：启动 PDF、JPG、PNG 或 PPTX 异步导出任务，可指定页码和导出质量。
- `getExportJob`：轮询导出任务状态；完成后的下载 URL 是 Canva 的临时链接，通常需要在有效期内使用。

典型流程是先 `listDesigns` 找到设计 ID，再 `getDesign` 或 `exportDesign`；导出后使用 `getExportJob` 获取状态和下载链接。创建和导出会产生外部副作用，不应在同一工作流中无条件重复调用。

## Secret 与权限

在 FastGPT 插件配置中设置：

- `accessToken`：Canva Connect integration 签发的 OAuth access token，作为 secret 保存。

创建 Canva integration 时，需要为令牌申请对应 scope，例如：

- 只读：`design:meta:read`
- 创建设计：`design:content:write`
- 导出设计：`design:content:read`

令牌只会作为 `Authorization: Bearer ...` 发送到固定的 `https://api.canva.com/rest/v1`，不会放进输入、请求 body、日志或工具输出。插件不接受自定义 base URL，不执行 shell，不创建本地进程，也不访问任意主机。

## 本地安装与验证

```bash
pnpm install --frozen-lockfile
pnpm run type-check
pnpm test
pnpm run build
pnpm run check
pnpm run pack
```

构建会把 `logo.svg` 复制进 `dist/`，并生成 `canva.pkg`。测试使用 mock `fetch` 覆盖请求构造、认证头、查询/JSON body、响应解析、错误和 token 脱敏；本环境没有真实 Canva 凭证，因此未进行真实 API 集成测试。

参考：[Canva Connect APIs](https://www.canva.dev/docs/connect/)
