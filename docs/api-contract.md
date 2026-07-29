# API 契约说明

> 接口路径、请求/响应字段、鉴权要求等约定在此维护。  
> 修改接口字段时请同步更新本文档。

## 通用响应结构

```json
{
  "success": true,
  "data": {},
  "message": "可选说明"
}
```

失败时：

```json
{
  "success": false,
  "data": null,
  "message": "错误说明"
}
```

## 约定摘要

| 项 | 约定 |
|----|------|
| 数据格式 | JSON |
| DB 字段 | snake_case |
| 前端字段 | camelCase（由 API 层转换） |
| 鉴权 | `Authorization: Bearer <token>`；服务端统一 `api/_lib/auth.js` → `verifyToken` |
| 数据库 | `api/_lib/db.js` |
| 商品状态 | `on_sale` / `reserved` / `sold` / `removed` |

## 接口列表

### 1. 商品列表

- **方法 / 路径**：`GET /api/items`
- **鉴权**：否
- **Query 参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 否 | 标题模糊搜索 |
| categoryId | uuid | 否 | 分类筛选 |
| status | string | 否 | 单状态筛选；不传时默认只返回 `on_sale`、`reserved` |
| page | number | 否 | 页码，默认 `1` |
| pageSize | number | 否 | 每页条数，默认 `10`，最大 `50` |

**响应示例**：

```json
{
  "success": true,
  "data": {
    "list": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "sellerId": "11111111-2222-3333-4444-555555555555",
        "title": "二手高等数学教材",
        "description": "几乎全新，无笔记",
        "price": 25.5,
        "categoryId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        "status": "on_sale",
        "imageUrl": "https://example.com/book.jpg",
        "createdAt": "2026-07-29T02:00:00.000Z",
        "updatedAt": "2026-07-29T02:00:00.000Z",
        "sellerUsername": "alice",
        "categoryName": "教材"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### 2. 商品详情

- **方法 / 路径**：`GET /api/items/:id`
- **鉴权**：否
- **路径参数**：`id`（商品 UUID）

**响应示例**：

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "sellerId": "11111111-2222-3333-4444-555555555555",
    "title": "二手高等数学教材",
    "description": "几乎全新，无笔记",
    "price": 25.5,
    "categoryId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "status": "on_sale",
    "imageUrl": "https://example.com/book.jpg",
    "createdAt": "2026-07-29T02:00:00.000Z",
    "updatedAt": "2026-07-29T02:00:00.000Z",
    "sellerUsername": "alice",
    "categoryName": "教材"
  }
}
```

商品不存在时：`404`，`message` 为「商品不存在」。

---

### 3. 创建商品

- **方法 / 路径**：`POST /api/items`
- **鉴权**：是（`Authorization: Bearer <token>`）
- **Body（JSON）**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 标题 |
| price | number | 是 | 价格，必须 `> 0` |
| description | string | 否 | 描述 |
| categoryId | uuid | 否 | 分类 ID |
| imageUrl | string | 否 | 图片 URL |

**业务规则**：同一卖家 5 分钟内不可重复发布相同标题（冲突时 `409`）。

**请求示例**：

```json
{
  "title": "二手高等数学教材",
  "price": 25.5,
  "description": "几乎全新，无笔记",
  "categoryId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "imageUrl": "https://example.com/book.jpg"
}
```

**响应示例**（`201`）：

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "sellerId": "11111111-2222-3333-4444-555555555555",
    "title": "二手高等数学教材",
    "description": "几乎全新，无笔记",
    "price": 25.5,
    "categoryId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "status": "on_sale",
    "imageUrl": "https://example.com/book.jpg",
    "createdAt": "2026-07-29T02:00:00.000Z",
    "updatedAt": "2026-07-29T02:00:00.000Z",
    "sellerUsername": "alice",
    "categoryName": "教材"
  },
  "message": "创建成功"
}
```

---

### 4. 更新商品

- **方法 / 路径**：`PATCH /api/items/:id`
- **鉴权**：是（`Authorization: Bearer <token>`）
- **权限**：仅商品所属卖家可修改；否则 `403`
- **路径参数**：`id`（商品 UUID）
- **Body（JSON）**：均为可选，只传需要修改的字段

| 字段 | 类型 | 说明 |
|------|------|------|
| title | string | 标题（非空） |
| description | string \| null | 描述 |
| price | number | 价格，必须 `> 0` |
| categoryId | uuid \| null | 分类 ID |
| imageUrl | string \| null | 图片 URL |
| status | string | `on_sale` / `reserved` / `sold` / `removed` |

**请求示例**（标记已预订）：

```json
{
  "status": "reserved"
}
```

**请求示例**（修改基本信息）：

```json
{
  "title": "高等数学教材（第七版）",
  "price": 20,
  "description": "有少量笔记"
}
```

**响应示例**：

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "sellerId": "11111111-2222-3333-4444-555555555555",
    "title": "高等数学教材（第七版）",
    "description": "有少量笔记",
    "price": 20,
    "categoryId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    "status": "reserved",
    "imageUrl": "https://example.com/book.jpg",
    "createdAt": "2026-07-29T02:00:00.000Z",
    "updatedAt": "2026-07-29T03:10:00.000Z",
    "sellerUsername": "alice",
    "categoryName": "教材"
  },
  "message": "更新成功"
}
```

---

### 5. 商品留言列表

- **方法 / 路径**：`GET /api/items/:id/messages`
- **鉴权**：是（`Authorization: Bearer <token>`）
- **权限**：仅该商品卖家，或曾在该商品下留言过的用户可查看；否则 `403`
- **路径参数**：`id`（商品 UUID）

商品不存在时：`404`，`message` 为「商品不存在」。

**响应示例**：

```json
{
  "success": true,
  "data": [
    {
      "id": "bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
      "itemId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "senderId": "22222222-3333-4444-5555-666666666666",
      "senderUsername": "bob",
      "content": "还在吗？可以便宜点吗？",
      "isSelected": false,
      "createdAt": "2026-07-29T04:00:00.000Z"
    }
  ]
}
```

---

### 6. 发表留言

- **方法 / 路径**：`POST /api/items/:id/messages`
- **鉴权**：是（`Authorization: Bearer <token>`）
- **路径参数**：`id`（商品 UUID）
- **Body（JSON）**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | 是 | 留言内容（trim 后非空） |

**请求示例**：

```json
{
  "content": "还在吗？可以便宜点吗？"
}
```

**响应示例**（`201`）：

```json
{
  "success": true,
  "data": {
    "id": "bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
    "itemId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "senderId": "22222222-3333-4444-5555-666666666666",
    "senderUsername": "bob",
    "content": "还在吗？可以便宜点吗？",
    "isSelected": false,
    "createdAt": "2026-07-29T04:00:00.000Z"
  },
  "message": "留言成功"
}
```

---

### 7. 选为买家（标记留言）

- **方法 / 路径**：`PATCH /api/messages/:id`
- **鉴权**：是（`Authorization: Bearer <token>`）
- **权限**：仅该留言所属商品的卖家可操作；否则 `403`
- **路径参数**：`id`（留言 UUID）
- **Body（JSON）**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| isSelected | boolean | 否 | 前端传 `true`；服务端固定执行选中逻辑 |

**业务规则**：

- 商品须为 `on_sale`，否则 `400`
- 将目标留言 `isSelected` 设为 `true`，同商品其它留言取消选中
- 同时将商品 `status` 改为 `reserved`

**请求示例**：

```json
{
  "isSelected": true
}
```

**响应示例**：

```json
{
  "success": true,
  "data": {
    "message": {
      "id": "bbbbbbbb-cccc-dddd-eeee-ffffffffffff",
      "itemId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "senderId": "22222222-3333-4444-5555-666666666666",
      "senderUsername": "bob",
      "content": "还在吗？可以便宜点吗？",
      "isSelected": true,
      "createdAt": "2026-07-29T04:00:00.000Z"
    },
    "item": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "sellerId": "11111111-2222-3333-4444-555555555555",
      "title": "二手高等数学教材",
      "description": "几乎全新，无笔记",
      "price": 25.5,
      "categoryId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      "status": "reserved",
      "imageUrl": "https://example.com/book.jpg",
      "createdAt": "2026-07-29T02:00:00.000Z",
      "updatedAt": "2026-07-29T04:10:00.000Z",
      "sellerUsername": "alice",
      "categoryName": "教材"
    }
  },
  "message": "已选为买家，商品状态更新为已预订"
}
```

---

### 8. 我的收藏列表

- **方法 / 路径**：`GET /api/favorites`
- **鉴权**：是（`Authorization: Bearer <token>`）

**响应示例**：

```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "sellerId": "11111111-2222-3333-4444-555555555555",
      "title": "二手高等数学教材",
      "description": "几乎全新，无笔记",
      "price": 25.5,
      "categoryId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      "status": "on_sale",
      "imageUrl": "https://example.com/book.jpg",
      "createdAt": "2026-07-29T02:00:00.000Z",
      "updatedAt": "2026-07-29T02:00:00.000Z",
      "sellerUsername": "alice",
      "categoryName": "教材",
      "isFavorited": true
    }
  ]
}
```

---

### 9. 收藏商品

- **方法 / 路径**：`POST /api/favorites/:itemId`
- **鉴权**：是（`Authorization: Bearer <token>`）
- **路径参数**：`itemId`（商品 UUID）
- **业务规则**：若已收藏则幂等返回成功；商品不存在时 `404`

**响应示例**：

```json
{
  "success": true,
  "data": null,
  "message": "已收藏"
}
```

---

### 10. 取消收藏

- **方法 / 路径**：`DELETE /api/favorites/:itemId`
- **鉴权**：是（`Authorization: Bearer <token>`）
- **路径参数**：`itemId`（商品 UUID）
- **业务规则**：收藏记录不存在时仍返回成功

**响应示例**：

```json
{
  "success": true,
  "data": null,
  "message": "已取消收藏"
}
```

---

### 11. 提交举报

- **方法 / 路径**：`POST /api/reports`
- **鉴权**：是（`Authorization: Bearer <token>`）
- **Body（JSON）**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| itemId | uuid | 是 | 被举报商品 ID |
| reason | string | 是 | 举报理由（trim 后非空） |

**请求示例**：

```json
{
  "itemId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "reason": "疑似虚假信息"
}
```

**响应示例**（`201`）：

```json
{
  "success": true,
  "data": {
    "id": "cccccccc-dddd-eeee-ffff-000000000000"
  },
  "message": "举报已提交"
}
```
