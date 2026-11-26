# 智能报修小助手

面向办公室的设备报修网站。填写姓名、办公区、设备类型和故障描述即可提交。工单列表可按状态筛选并按关键词搜索，详情页展示原始报修信息、处理状态和三条自助排查建议。可在详情页将状态改为待处理、处理中或已完成。

## 本地运行

建议使用 Node.js 24。解压源码，在项目目录打开终端，执行：

```bash
npm ci
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)。本地默认将工单持久化到 `.repair/tickets.sqlite`，更换浏览器或重启服务后仍可读取同一数据库。未配置 DeepSeek 时，页面会明确标注建议来自内置排查指南。

```bash
npm test
npm run build
```

## 接入 Supabase 和 DeepSeek

1. 创建 Supabase 项目。在 SQL Editor 中运行 [supabase/schema.sql](supabase/schema.sql)，创建 `public.tickets`。项目启用了行级安全，表由应用服务器读写。
2. 将 `.env.example` 复制为 `.env.local`，按下表配置，再重启本地开发服务。服务端密钥只放在环境变量中。

| 环境变量 | 用途 |
| --- | --- |
| `SUPABASE_URL` | Supabase 的项目 URL。旧命名 `NEXT_PUBLIC_SUPABASE_URL` 也可识别 |
| `SUPABASE_SECRET_KEY` | Supabase 的服务端 Secret key。已有项目可改用 `SUPABASE_SERVICE_ROLE_KEY` |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway 密钥（部署手册第五步获取），优先使用 |
| `AI_GATEWAY_MODEL` | 可选。网关模型，默认 `deepseek/deepseek-v3.2` |
| `DEEPSEEK_API_KEY` | 可选。未配置网关时直连 DeepSeek |
| `DEEPSEEK_MODEL` | 可选。直连时的模型，默认 `deepseek-flash` |
| `REPAIR_ACCESS_PASSWORD` | Vercel 部署必填。使用高强度密码，登录用户名为 `repair` |
| `REPAIR_ACCOUNTS` | 可选。额外内部账号，格式 `用户名:密码,用户名2:密码2`，与 `repair` 账号并存 |

3. 提交一条测试报修，确认 Supabase Table Editor 出现新行。建议区显示「由 DeepSeek 生成」时，表示此次请求成功调用了模型（网关或直连均可）。上游不可用时查看服务器日志中的 `[repair.suggest]`，工单仍可保存，建议标为内置指南。

发送至 DeepSeek 的字段只有设备类型和故障描述。请使用虚构的演练数据验证。

[Supabase 密钥说明](https://supabase.com/docs/guides/getting-started/api-keys) · [DeepSeek 模型文档](https://api-docs.deepseek.com/quick_start/pricing/)

## 部署到 Vercel

1. 将工程导入私有 GitHub 仓库 `smart-repair`。邀请队友，给 `main` 设置 Pull Request 合并要求。建议各自负责界面和数据接口，分别提交分支供对方审核。
2. 在 Vercel 导入仓库，框架选 Next.js，Node.js 选 24.x。在项目环境变量中配置上表内容，部署或重新部署。
3. 打开 Vercel 分配的网址，以 `repair` 和已配置的密码登录。验证提交、列表、详情和状态更新，再从另一浏览器登录确认工单可读。
4. 有自有域名时，在 Vercel 的 Domains 添加域名，按控制台给出的 DNS 记录配置，验证 HTTPS 访问。

## 接口契约

| 方法和路径 | 请求 | 成功返回 |
| --- | --- | --- |
| `POST /api/suggest/` | `{ deviceType, description }` | `{ suggestions, source }` |
| `POST /api/tickets/` | `{ name, area, deviceType, description }` | 201，`{ ticket }` |
| `GET /api/tickets/` | 无 | `{ tickets }` |
| `GET /api/tickets/<id>/` | 无 | `{ ticket }` |
| `PATCH /api/tickets/<id>/` | `{ status }` | `{ ticket }` |

`suggestions` 是三个字符串的数组，`source` 为 `deepseek` 或 `guide`。提交时由服务端生成建议并随工单一起保存。客户端可调用建议接口预览，预览本身不会创建工单。

`app/` 和 `components/` 是页面与界面，`pages/api/` 是 Next.js API 入口，`lib/` 是校验、建议服务和存储实现，`supabase/` 是部署用建表 SQL。在线演示的适配器在 `worker/`，D1 迁移在 `drizzle/`。演示和本地、Vercel 分别使用各自的数据库。
