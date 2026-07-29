# 校园二手交易平台

面向校园场景的二手物品交易平台，支持闲置发布、浏览检索、留言沟通、收藏与举报等能力。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + TypeScript + Vue Router + Pinia + Axios + Element Plus |
| 后端 | Node.js（Vercel Serverless Functions） |
| 数据库 | Neon Postgres |
| 部署 | Vercel |

## 仓库结构

```
campus-secondhand/
├── web/          # 前端（Vue3 + Vite），构建产物输出到 web/dist
├── api/          # Vercel Serverless Functions（/api/* 接口）
├── db/           # 数据库建表脚本（schema.sql）
├── docs/         # API 契约等文档
├── vercel.json   # Vercel 构建与路由配置
├── TESTING.md    # 测试说明
└── README.md
```

## 本地开发

### 前置要求

- Node.js 18+
- npm

### 环境变量

根目录复制 `.env.example` 为 `.env`，并填入：

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | Neon Postgres 连接串（须指向本项目库，并已执行 `db/schema.sql`） |
| `JWT_SECRET` | JWT 签名密钥（足够长的随机字符串） |

**切勿将 `.env` 提交到 Git。**

本地 `vercel dev` / 前端代理联调时，同样依赖上述变量（由 Vercel CLI 或根目录 `.env` 注入到 Serverless Functions）。

### 启动前端

```bash
cd web
npm install
npm run dev
```

浏览器访问终端提示的本地地址（默认 `http://localhost:5173`）。开发服务器会将 `/api` 代理到 `http://localhost:3000`（可与 `vercel dev` 联调）。

### 后端 / 数据库

- `api/`：Serverless Functions，路径与 URL 对应（如 `api/auth/login.js` → `POST /api/auth/login`）
- `db/schema.sql`：在 Neon SQL Editor 中执行以初始化表结构

## 测试

轻量核心链路测试说明见 [TESTING.md](./TESTING.md)。

```bash
cd api && npm test
cd web && npm test
```

## 部署指南

本项目以 **仓库根目录** 作为 Vercel 项目根：前端构建自 `web/`，接口来自根目录 `api/`。

### 1. 导入项目

1. 打开 [Vercel Dashboard](https://vercel.com/dashboard) → **Add New…** → **Project**
2. 导入本 Git 仓库，**Root Directory** 保持仓库根（不要选成 `web/`）
3. Framework Preset 可保持 Other / Vite；实际构建以根目录 `vercel.json` 为准：
   - `installCommand`：分别安装 `api/` 与 `web/` 依赖
   - `buildCommand`：构建前端静态资源
   - `outputDirectory`：`web/dist`
   - `rewrites`：非 `/api/*` 请求回退到 `index.html`（支持 Vue Router）
4. **先不要 Deploy**，先完成下一步环境变量配置

### 2. 配置环境变量（必填）

部署前必须在 Vercel 项目中配置以下变量，否则登录/鉴权与数据库访问会失败。

| 变量名 | 用途 | 取值来源 |
|--------|------|----------|
| `DATABASE_URL` | Neon Postgres 连接串 | Neon 控制台 → 项目 `campus-secondhand` → Connection string |
| `JWT_SECRET` | 签发与校验登录 Token | 自行生成足够长的随机字符串（勿用示例占位值） |

**配置位置与步骤：**

1. 进入该 Vercel 项目 → **Settings** → **Environment Variables**
2. 分别添加 `DATABASE_URL`、`JWT_SECRET`
3. Environment 建议勾选 **Production**、**Preview**、**Development**（评审预览部署也需要能连库）
4. 保存后，若项目已有部署，需 **Redeploy** 一次使新变量生效（仅改环境变量不会自动注入到旧 Deployment）

> 说明：环境变量在 **Vercel 项目设置** 中配置，不要写进 `vercel.json`，也不要提交到 Git。本地开发继续使用根目录 `.env`。

### 3. 触发部署

- 推送代码到已关联的 Git 分支，或在 Vercel 项目页点击 **Deploy** / **Redeploy**
- 构建成功后，生产域名下：
  - `/` 及前端路由 → 静态 SPA（`web/dist`）
  - `/api/*` → Serverless Functions（`api/` 目录）

### 4. 评审快速复现检查清单

- [ ] Neon 已执行 `db/schema.sql`，存在 `users` / `items` 等表
- [ ] Vercel Environment Variables 已配置 `DATABASE_URL`、`JWT_SECRET`
- [ ] Root Directory 为仓库根，且使用仓库内 `vercel.json`
- [ ] 部署完成后访问首页可打开；调用 `POST /api/auth/register` 可返回 token（或在页面完成注册登录）
