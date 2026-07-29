# 测试说明（TESTING）

轻量测试计划与覆盖说明。不追求覆盖率，聚焦核心业务链路与关键组件渲染。

## 如何运行

### 前置条件（API 集成测试）

仓库根目录 `.env` 需配置：

- `DATABASE_URL` — **本项目** Neon Postgres 连接串（Neon 控制台项目名应为 `campus-secondhand`）
- `JWT_SECRET` — JWT 签名密钥

并已在该库执行过 `db/schema.sql`（存在 `users` / `items` / `messages` 等表）。

缺失 `DATABASE_URL` 或 `JWT_SECRET` 时，API 集成用例会 **跳过**（不会误报失败），并在控制台提示。

若连接串指向了其他项目库（例如仅有无关业务表、没有 `users`），测试会报 `relation "users" does not exist`——请核对 `.env` 中的 `DATABASE_URL`。

### API

```bash
cd api
npm install
npm test
```

### 前端

```bash
cd web
npm install
npm test
```

## 本次已覆盖场景

### API（`api/__tests__/`）

| 用例文件 | 场景 |
|----------|------|
| `auth-flow.test.js` | 注册 + 登录均返回合法 JWT（三段式 token） |
| `auth-required.test.js` | 未带 Authorization 调用发布商品 → `401` |
| `item-publish-list.test.js` | 卖家发布商品后，公开列表按 keyword 可查到 |
| `select-buyer-reserved.test.js` | 买家留言 → 卖家选中留言 → 商品 `status` 变为 `reserved` |

实现方式：vitest 直接调用 Vercel Serverless handler（mock `req`/`res`），连真实数据库，不做 HTTP 服务层。

### 前端（`web/src/__tests__/`）

| 用例文件 | 场景 |
|----------|------|
| `ItemCard.spec.ts` | 商品卡片渲染标题、价格、状态标签、详情链接；无图占位 |
| `LoginView.spec.ts` | 登录页基础渲染；空表单提交不调用 `login` |

## 已知未覆盖的风险点

以下问题当前测试 **未** 覆盖，后续可按需补测：

1. **并发选买家**：多请求同时 `PATCH /api/messages/:id` 时，是否只保留一条选中、状态是否一致。
2. **图片 URL 合法性**：`imageUrl` 未做严格 URL / 协议校验，恶意或无效链接仍可入库。
3. **5 分钟同标题冲突**：同一卖家短时间重复发布相同标题的 `409` 边界。
4. **Token 过期 / 篡改**：过期 JWT、伪造签名、错误算法等鉴权边界。
5. **权限边界**：非卖家选买家、非留言者查看留言列表等 `403` 场景。
6. **收藏 / 举报 / 分类**：相关接口与前端交互未纳入本次用例。
7. **真实浏览器 E2E**：未使用 Playwright/Cypress；代理、路由守卫、Element Plus 真组件行为未端到端验证。
8. **测试数据清理**：集成测试会写入用户/商品/留言，未自动 teardown，长期跑测可能产生脏数据。

## 约定

- API 测试用户名使用时间戳 + 随机后缀，降低冲突概率。
- 业务逻辑变更涉及上述核心链路时，请同步更新对应用例与本文档。
