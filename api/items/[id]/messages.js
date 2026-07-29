/**
 * GET /api/items/[id]/messages — 留言列表（需鉴权：卖家或曾留言者）
 * POST /api/items/[id]/messages — 发表留言（需鉴权，content 必填）
 */
const { sql } = require('../../_lib/db');
const { verifyToken } = require('../../_lib/auth');
const { mapMessage, ok, fail, handleError } = require('../../_lib/response');

/**
 * @param {import('http').IncomingMessage & { method?: string, query?: Record<string, string | string[]>, body?: unknown }} req
 * @param {import('http').ServerResponse} res
 */
module.exports = async function handler(req, res) {
  try {
    const itemId = pickId(req);
    if (!itemId) {
      return fail(res, 400, '缺少商品 id');
    }

    if (req.method === 'GET') {
      return await listMessages(req, res, itemId);
    }
    if (req.method === 'POST') {
      return await createMessage(req, res, itemId);
    }
    res.setHeader('Allow', 'GET, POST');
    return fail(res, 405, '方法不允许');
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {string} itemId
 */
async function listMessages(req, res, itemId) {
  const userId = verifyToken(req);

  const items = await sql`
    SELECT id, seller_id
    FROM items
    WHERE id = ${itemId}::uuid
    LIMIT 1
  `;
  if (items.length === 0) {
    return fail(res, 404, '商品不存在');
  }

  const item = items[0];
  const isSeller = item.seller_id === userId;

  if (!isSeller) {
    const prior = await sql`
      SELECT id
      FROM messages
      WHERE item_id = ${itemId}::uuid AND sender_id = ${userId}::uuid
      LIMIT 1
    `;
    if (prior.length === 0) {
      return fail(res, 403, '仅该商品卖家或曾留言过的人可查看留言');
    }
  }

  const rows = await sql`
    SELECT
      m.id,
      m.item_id,
      m.sender_id,
      m.content,
      m.is_selected,
      m.created_at,
      u.username AS sender_username
    FROM messages m
    LEFT JOIN users u ON u.id = m.sender_id
    WHERE m.item_id = ${itemId}::uuid
    ORDER BY m.created_at ASC
  `;

  return ok(res, rows.map(mapMessage));
}

/**
 * @param {import('http').IncomingMessage & { body?: unknown }} req
 * @param {import('http').ServerResponse} res
 * @param {string} itemId
 */
async function createMessage(req, res, itemId) {
  const userId = verifyToken(req);
  const body = parseBody(req.body);
  const content = typeof body.content === 'string' ? body.content.trim() : '';

  if (!content) {
    return fail(res, 400, '留言内容不能为空');
  }

  const items = await sql`
    SELECT id FROM items WHERE id = ${itemId}::uuid LIMIT 1
  `;
  if (items.length === 0) {
    return fail(res, 404, '商品不存在');
  }

  const inserted = await sql`
    INSERT INTO messages (item_id, sender_id, content)
    VALUES (${itemId}::uuid, ${userId}::uuid, ${content})
    RETURNING id
  `;

  const rows = await sql`
    SELECT
      m.id,
      m.item_id,
      m.sender_id,
      m.content,
      m.is_selected,
      m.created_at,
      u.username AS sender_username
    FROM messages m
    LEFT JOIN users u ON u.id = m.sender_id
    WHERE m.id = ${inserted[0].id}
    LIMIT 1
  `;

  return ok(res, mapMessage(rows[0]), '留言成功', 201);
}

/**
 * @param {{ query?: Record<string, string | string[]> }} req
 * @returns {string}
 */
function pickId(req) {
  const v = req.query?.id;
  if (Array.isArray(v)) return (v[0] || '').trim();
  return (v || '').trim();
}

/**
 * @param {unknown} body
 * @returns {Record<string, unknown>}
 */
function parseBody(body) {
  if (!body) return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  if (typeof body === 'object') return /** @type {Record<string, unknown>} */ (body);
  return {};
}
