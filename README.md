# 校园二手交易平台

面向校园场景的二手物品交易平台，支持闲置发布、浏览检索、下单沟通等能力（业务功能开发中）。

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
├── web/          # 前端（Vue3 + Vite）
├── api/          # Vercel Serverless Functions（每个文件对应一个接口）
├── db/           # 数据库建表 / 迁移脚本
├── vercel.json   # Vercel 部署配置
└── README.md
```

## 本地开发

### 前置要求

- Node.js 18+
- npm

### 启动前端

```bash
cd web
npm install
npm run dev
```

浏览器访问终端提示的本地地址（默认 `http://localhost:5173`）。

### 环境变量

根目录复制 `.env.example` 为 `.env`，并填入 Neon / 本地数据库连接信息。  
**切勿将 `.env` 提交到 Git。**

### 后端 / 数据库

- `api/`：后续放置 Serverless Functions
- `db/`：后续放置建表 SQL

本地联调与 Vercel 部署细节待补充。

## 部署

推送到已连接 Vercel 的 Git 仓库后，将按 `vercel.json` 构建前端并部署：

- `buildCommand`: `cd web && npm install && npm run build`
- `outputDirectory`: `web/dist`
