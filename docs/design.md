# 校园二手交易平台 — 设计文档

> 本文档描述系统目标、架构、数据模型、核心业务与前后端实现约定。  
> 接口字段级契约见 [api-contract.md](./api-contract.md)；测试说明见根目录 [TESTING.md](../TESTING.md)。

---

## 1. 概述

### 1.1 产品定位

面向校园场景的轻量二手物品交易平台。用户可发布闲置、浏览检索、留言沟通、收藏与举报；卖家可在留言中选定买家并将商品标记为已预订。

### 1.2 设计目标

| 目标 | 说明 |
|------|------|
| 轻量可部署 | 前后端一体部署于 Vercel，数据库用 Neon Postgres |
| 契约清晰 | API 统一 JSON 响应；DB snake_case ↔ 前端 camelCase |
| 鉴权统一 | JWT + Bearer；服务端统一 `verifyToken`，禁止各接口自写校验 |
| 核心闭环 | 注册/登录 → 发布/浏览 → 留言 → 选买家（预订）→ 收藏/举报 |

### 1.3 非目标（当前范围外）

- 在线支付、物流、订单履约
- 实时 IM / WebSocket
- 管理后台与举报审核工作流
- 图片上传存储（当前仅支持外链 `imageUrl`）

---

## 2. 系统架构

### 2.1 总体结构

```
┌─────────────┐     HTTPS      ┌──────────────────────────────┐
│  浏览器 SPA  │ ◄────────────► │           Vercel              │
│  (Vue 3)    │                │  ┌────────┐  ┌─────────────┐ │
└─────────────┘                │  │ web/   │  │ api/*       │ │
                               │  │ dist   │  │ Serverless  │ │
                               │  └────────┘  └──────┬──────┘ │
                               └─────────────────────┼────────┘
                                                     │
                                                     ▼
                                            ┌────────────────┐
                                            │ Neon Postgres  │
                                            └────────────────┘
```

- **前端**：Vue 3 SPA，构建产物 `web/dist`，由 Vercel 静态托管；非 `/api/*` 请求 rewrite 到 `index.html`（支持 Vue Router history）。
- **后端**：`api/` 目录下的 Vercel Serverless Functions，路径映射为 `/api/...`。
- **数据库**：Neon Postgres；应用侧通过 `@neondatabase/serverless` 的 `neon()` 客户端访问。

### 2.2 仓库布局

```
campus-secondhand/
├── web/                 # 前端 Vue3 + Vite + TypeScript
│   └── src/
│       ├── api/         # 按域封装的请求函数
│       ├── components/  # 通用组件（PascalCase）
│       ├── layouts/     # 布局壳
│       ├── views/       # 页面级组件
│       ├── stores/      # Pinia（登录态）
│       ├── router/      # 路由与守卫
│       ├── types/       # 与契约对齐的 TS 类型
│       └── utils/       # request 等工具
├── api/                 # Serverless 接口
│   ├── _lib/            # auth / db / response 公共库
│   ├── auth/            # 注册、登录
│   ├── categories/      # 分类
│   ├── items/           # 商品 CRUD、留言
│   ├── messages/        # 选买家
│   ├── favorites/       # 收藏
│   ├── reports.js       # 举报
│   └── dev-server.js    # 本地 API 模拟（:3000）
├── db/schema.sql        # 建表与初始分类
├── docs/                # 设计文档、API 契约
└── vercel.json          # 构建、输出目录、SPA rewrite
```

### 2.3 本地联调

| 进程 | 命令 | 端口 |
|------|------|------|
| API | `cd api && npm run dev` | `3000` |
| Web | `cd web && npm run dev` | `5173` |

前端 Vite 将 `/api` 代理到 `http://localhost:3000`。仅启动前端会导致代理 `ECONNREFUSED`。

环境变量（根目录 `.env`）：`DATABASE_URL`、`JWT_SECRET`。

---

## 3. 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3、Vite、TypeScript、Vue Router、Pinia、Axios、Element Plus |
| 后端 | Node.js、Vercel Serverless Functions |
| 鉴权 | bcryptjs（密码）、jsonwebtoken（JWT，有效期 7d） |
| 数据库 | Neon Postgres（`pgcrypto` 生成 UUID） |
| 部署 | Vercel（仓库根为项目根） |
| 测试 | Vitest（API 直调 handler；前端组件单测） |

---

## 4. 数据模型

### 4.1 ER 关系（逻辑）

```
users 1───* items
users 1───* messages（sender）
users 1───* favorites
users 1───* reports（reporter）
categories 1───* items
items 1───* messages
items 1───* favorites
items 1───* reports
```

### 4.2 表说明

| 表 | 职责 |
|----|------|
| `users` | 账号；`password_hash` 存 bcrypt，不回传前端 |
| `categories` | 商品分类；种子数据：教材 / 数码 / 生活用品 / 服饰 / 其他 |
| `items` | 闲置商品；状态枚举见下 |
| `messages` | 商品下留言；`is_selected` 标识卖家选中的买家留言 |
| `favorites` | 用户收藏；`(user_id, item_id)` 唯一 |
| `reports` | 举报记录 |

### 4.3 商品状态机

```
         发布
           │
           ▼
       ┌─────────┐   选买家 / 手动改状态    ┌──────────┐
       │ on_sale │ ───────────────────────► │ reserved │
       └────┬────┘                          └────┬─────┘
            │                                    │
            │ 手动更新                           │ 手动更新
            ▼                                    ▼
       ┌─────────┐                          ┌────────┐
       │  sold   │◄─────────────────────────│  ...   │
       └─────────┘                          └────────┘
            ▲
            │
       ┌─────────┐
       │ removed │  （下架；公开列表默认不展示）
       └─────────┘
```

| 状态 | 含义 |
|------|------|
| `on_sale` | 在售（公开列表默认包含） |
| `reserved` | 已预订（公开列表默认包含；选买家后自动进入） |
| `sold` | 已售出 |
| `removed` | 已下架 |

状态变更途径：

1. **选买家**：`PATCH /api/messages/:id` —— 商品须为 `on_sale`，成功后强制改为 `reserved`，并保证同商品仅一条留言 `is_selected=true`。
2. **卖家更新商品**：`PATCH /api/items/:id` —— 可显式传入 `status`。

### 4.4 索引策略

- `items`：`seller_id`、`category_id`、`status`、`created_at DESC`
- `messages`：`item_id`、`sender_id`
- `favorites`：`user_id`、`item_id`
- `reports`：`item_id`、`reporter_id`

---

## 5. 后端设计

### 5.1 公共库（强制约定）

| 模块 | 路径 | 职责 |
|------|------|------|
| 鉴权 | `api/_lib/auth.js` | `hashPassword` / `verifyPassword` / `generateToken` / `verifyToken` |
| 数据库 | `api/_lib/db.js` | 导出共享 `sql`（基于 `DATABASE_URL`） |
| 响应 | `api/_lib/response.js` | `ok` / `fail` / `handleError`；`mapItem` / `mapMessage` / `mapUser` |

**禁止**：在各接口文件中重复实现 JWT 校验或各自 `new` 数据库连接。

### 5.2 统一响应

```json
{ "success": true, "data": {}, "message": "可选说明" }
```

失败：`success: false`，`data` 多为 `null`，`message` 为错误说明；HTTP 状态码表达鉴权/权限/资源等语义（如 401 / 403 / 404）。

### 5.3 字段转换

- 数据库列：`snake_case`（如 `seller_id`、`created_at`）
- 返回前端：API 层映射为 `camelCase`（如 `sellerId`、`createdAt`）
- 禁止将 snake_case 原样返回前端

### 5.4 接口一览

| 方法 | 路径 | 鉴权 | 说明 |
|------|------|------|------|
| POST | `/api/auth/register` | 否 | 注册并返回 token |
| POST | `/api/auth/login` | 否 | 登录并返回 token |
| GET | `/api/categories` | 否 | 分类列表 |
| GET | `/api/items` | `mine=true` 时需要 | 列表 / 我的发布 |
| GET | `/api/items/:id` | 否 | 详情 |
| POST | `/api/items` | 是 | 发布（5 分钟内同卖家同标题 → 409） |
| PATCH | `/api/items/:id` | 是（仅卖家） | 更新信息或状态 |
| GET | `/api/items/:id/messages` | 是 | 卖家或曾留言者可看 |
| POST | `/api/items/:id/messages` | 是 | 发表留言 |
| PATCH | `/api/messages/:id` | 是（仅卖家） | 选为买家 → `reserved` |
| GET | `/api/favorites` | 是 | 我的收藏 |
| POST | `/api/favorites/:itemId` | 是 | 收藏（幂等） |
| DELETE | `/api/favorites/:itemId` | 是 | 取消收藏（幂等） |
| POST | `/api/reports` | 是 | 提交举报 |

字段级细节见 [api-contract.md](./api-contract.md)。

### 5.5 Serverless 路由映射

Vercel 将 `api/` 文件路径映射为 URL，例如：

- `api/auth/login.js` → `POST /api/auth/login`
- `api/items/[id].js` → `/api/items/:id`
- `api/items/[id]/messages.js` → `/api/items/:id/messages`
- `api/favorites/[itemId].js` → `/api/favorites/:itemId`

本地 `dev-server.js` 模拟同等路由，便于 Vite 代理联调。

---

## 6. 前端设计

### 6.1 分层

```
views / components
        │
        ▼
   src/api/*（按域）
        │
        ▼
 utils/request.ts（Axios 实例 + Authorization + ElMessage）
        │
        ▼
      /api/*（后端）
```

- 业务代码禁止另起未封装的 Axios 实例（除非有明确例外）。
- 类型定义集中在 `web/src/types/index.ts`，与契约 camelCase 对齐。

### 6.2 路由与权限

布局：`AppLayout` 包裹业务页。

| 路由 | 页面 | 元信息 |
|------|------|--------|
| `/` | HomeView | 公开 |
| `/login` `/register` | 登录 / 注册 | `guestOnly` |
| `/items/new` `/items/:id/edit` | ItemFormView | `requiresAuth` |
| `/items/:id` | ItemDetailView | 公开 |
| `/my/items` | MyItemsView | `requiresAuth` |
| `/my/favorites` | MyFavoritesView | `requiresAuth` |

守卫：未登录访问需鉴权页 → 跳转登录并带 `redirect`；已登录访问 guestOnly → 回首页。

### 6.3 状态管理

`useUserStore`（Pinia）：

- 持久化键：`cs_token`、`cs_user`（localStorage）
- `setAuth` / `logout`；`isLoggedIn` 供路由与 UI 使用
- `request.ts` 从 store / localStorage 读取 token 写入 `Authorization: Bearer ...`

### 6.4 主要页面职责

| 页面 | 职责 |
|------|------|
| HomeView | 关键词 / 分类筛选、分页浏览在售与预订商品 |
| ItemDetailView | 详情、留言（鉴权后）、收藏、举报、卖家选买家 |
| ItemFormView | 发布与编辑商品 |
| MyItemsView | 我的发布与状态管理 |
| MyFavoritesView | 收藏列表 |
| LoginView / RegisterView | 账号入口 |

### 6.5 通用组件

- `ItemCard`：列表卡片（标题、价格、状态、链接）
- `StatusTag`：商品状态展示
- `ReportDialog`：举报弹窗

命名：组件 **PascalCase**；页面在 `views/`，通用组件在 `components/`。

---

## 7. 核心业务流程

### 7.1 注册 / 登录

1. 客户端提交用户名、密码。
2. 注册：校验长度与唯一性 → bcrypt 哈希入库 → 签发 JWT → 返回 `token` + `user`。
3. 登录：校验密码 → 签发 JWT。
4. 前端 `setAuth` 写入 Pinia + localStorage，后续请求自动带 Token。

### 7.2 发布与浏览

1. 卖家登录后填写标题、价格、可选描述/分类/图片 URL。
2. 服务端校验价格 `> 0`；5 分钟内同卖家同标题拒绝（409）。
3. 公开列表默认 `on_sale` + `reserved`；支持 `keyword`、`categoryId`、分页；`mine=true` 需鉴权并返回当前用户全部状态商品。

### 7.3 留言与选买家

```
买家留言 ──► messages(is_selected=false)
                    │
卖家 PATCH /api/messages/:id
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
  目标留言 is_selected=true   商品 status=reserved
  同商品其它留言取消选中
```

前置：商品须为 `on_sale`；操作者须为卖家。

留言列表可见性：卖家，或曾在该商品下留言过的用户；否则 403。

### 7.4 收藏与举报

- 收藏：按用户维度；重复收藏 / 取消不存在记录均幂等成功。
- 举报：写入 `reports`（含 `itemId`、`reason`）；当前无审核后台，仅落库。

---

## 8. 安全与配置

| 项 | 设计 |
|----|------|
| 密码 | bcrypt，salt rounds = 10；哈希不落响应 |
| 会话 | JWT（payload 含 `userId`），有效期 7 天；Header `Authorization: Bearer <token>` |
| 密钥 | `JWT_SECRET` 仅环境变量；未配置时签发失败 / 校验返回 500 |
| 数据权限 | 改商品 / 选买家仅卖家；留言列表按卖家或参与留言者过滤 |
| 密钥与连接串 | 不进 Git；本地 `.env`，线上 Vercel Environment Variables |

---

## 9. 部署设计

以**仓库根目录**为 Vercel 项目根（不要设为 `web/`）。

`vercel.json` 要点：

- `installCommand`：分别安装 `api/` 与 `web/` 依赖
- `buildCommand`：构建前端 → `web/dist`
- `outputDirectory`：`web/dist`
- `rewrites`：非 `api` 路径回退 `index.html`

生产环境必配：`DATABASE_URL`、`JWT_SECRET`（建议 Production / Preview / Development 均配置）。  
数据库须已执行 `db/schema.sql`。

流量分流：

- `/api/*` → Serverless Functions
- 其余 → SPA 静态资源 + history fallback

---

## 10. 测试策略

聚焦核心链路，不追求全量覆盖。

| 层级 | 覆盖示例 |
|------|----------|
| API | 注册登录 JWT；未鉴权发布 401；发布后列表可搜；留言选买家 → `reserved` |
| 前端 | ItemCard 渲染；LoginView 基础交互 |

已知缺口（并发选买家、imageUrl 校验、403 边界、E2E 等）见 [TESTING.md](../TESTING.md)。

业务变更触及核心链路时，须同步更新用例与测试文档。

---

## 11. 约定与协作

1. **API 契约同步**：路径 / 字段 / 响应结构变更时，必须更新 `docs/api-contract.md`；新增接口宜与实现同批补文档。
2. **命名**：DB snake_case；前端与 API 响应 camelCase；Vue 组件 PascalCase。
3. **错误提示**：前端统一经封装请求层用 Element Plus `ElMessage`。
4. **文档关系**：
   - 本文：架构与业务设计
   - `api-contract.md`：接口契约
   - `README.md`：快速开始与部署
   - `TESTING.md`：测试范围与缺口

---

## 12. 修订记录

| 日期 | 说明 |
|------|------|
| 2026-07-29 | 初版：基于当前仓库实现整理系统与业务设计 |
