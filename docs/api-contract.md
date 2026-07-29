# API 契约说明

> 占位文件。接口路径、请求/响应字段、鉴权要求等约定将在此维护。  
> 修改接口字段时请同步更新本文档。

## 通用响应结构

```json
{
  "success": true,
  "data": {},
  "message": "可选说明"
}
```

## 约定摘要

| 项 | 约定 |
|----|------|
| 数据格式 | JSON |
| DB 字段 | snake_case |
| 前端字段 | camelCase（由 API 层转换） |
| 鉴权 | `api/_lib/auth.js` → `verifyToken` |
| 数据库 | `api/_lib/db.js` |

## 接口列表

（待补充）
