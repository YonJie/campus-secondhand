/**
 * 统一 API 响应与 snake_case → camelCase 转换工具。
 */

/**
 * 将下划线字段名转为 camelCase。
 * @param {string} key
 * @returns {string}
 */
function toCamelKey(key) {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * 递归将对象/数组的键转为 camelCase。
 * @param {unknown} value
 * @returns {unknown}
 */
function toCamelCase(value) {
  if (Array.isArray(value)) {
    return value.map(toCamelCase);
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    /** @type {Record<string, unknown>} */
    const result = {};
    for (const [k, v] of Object.entries(value)) {
      result[toCamelKey(k)] = toCamelCase(v);
    }
    return result;
  }
  return value;
}

/**
 * 将商品行（含可选联表字段）转为前端 camelCase 结构。
 * @param {Record<string, unknown>} row
 * @returns {Record<string, unknown>}
 */
function mapItem(row) {
  if (!row) return null;
  return {
    id: row.id,
    sellerId: row.seller_id,
    title: row.title,
    description: row.description ?? null,
    price: row.price != null ? Number(row.price) : null,
    categoryId: row.category_id ?? null,
    status: row.status,
    imageUrl: row.image_url ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...(row.seller_username !== undefined
      ? { sellerUsername: row.seller_username }
      : {}),
    ...(row.category_name !== undefined
      ? { categoryName: row.category_name ?? null }
      : {}),
  };
}

/**
 * 将留言行（含可选发送者用户名）转为前端 camelCase 结构。
 * @param {Record<string, unknown>} row
 * @returns {Record<string, unknown>}
 */
function mapMessage(row) {
  if (!row) return null;
  return {
    id: row.id,
    itemId: row.item_id,
    senderId: row.sender_id,
    content: row.content,
    isSelected: Boolean(row.is_selected),
    createdAt: row.created_at,
    ...(row.sender_username !== undefined
      ? { senderUsername: row.sender_username }
      : {}),
  };
}

/**
 * 将用户行转为前端 camelCase 结构（不含密码）。
 * @param {Record<string, unknown>} row
 * @returns {Record<string, unknown>}
 */
function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    avatarUrl: row.avatar_url ?? null,
    createdAt: row.created_at,
  };
}

/**
 * 成功响应。
 * @param {import('http').ServerResponse} res
 * @param {unknown} data
 * @param {string} [message]
 * @param {number} [statusCode=200]
 */
function ok(res, data, message, statusCode = 200) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ success: true, data, ...(message ? { message } : {}) }));
}

/**
 * 失败响应。
 * @param {import('http').ServerResponse} res
 * @param {number} statusCode
 * @param {string} message
 * @param {unknown} [data=null]
 */
function fail(res, statusCode, message, data = null) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ success: false, data, message }));
}

/**
 * 捕获鉴权等带 statusCode 的错误并写入响应。
 * @param {import('http').ServerResponse} res
 * @param {unknown} err
 */
function handleError(res, err) {
  const statusCode =
    err && typeof err === 'object' && 'statusCode' in err && typeof err.statusCode === 'number'
      ? err.statusCode
      : 500;
  const message =
    err && typeof err === 'object' && 'message' in err && typeof err.message === 'string'
      ? err.message
      : '服务器内部错误';
  if (statusCode >= 500) {
    console.error('[api]', err);
  }
  fail(res, statusCode, message);
}

/** 合法商品状态 */
const ITEM_STATUSES = ['on_sale', 'reserved', 'sold', 'removed'];

module.exports = {
  toCamelCase,
  mapItem,
  mapMessage,
  mapUser,
  ok,
  fail,
  handleError,
  ITEM_STATUSES,
};
