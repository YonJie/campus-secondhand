/**
 * POST /api/reports — 提交举报（需鉴权，itemId + reason 必填）
 */
const { sql } = require('./_lib/db');
const { verifyToken } = require('./_lib/auth');
const { ok, fail, handleError } = require('./_lib/response');

/**
 * @param {import('http').IncomingMessage & { method?: string, body?: unknown }} req
 * @param {import('http').ServerResponse} res
 */
module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return fail(res, 405, '方法不允许');
    }

    const userId = verifyToken(req);
    const body = parseBody(req.body);

    const itemId =
      body.itemId !== undefined && body.itemId !== null
        ? String(body.itemId).trim()
        : '';
    const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

    if (!itemId) {
      return fail(res, 400, 'itemId 必填');
    }
    if (!reason) {
      return fail(res, 400, '请填写举报理由');
    }

    const items = await sql`
      SELECT id FROM items WHERE id = ${itemId}::uuid LIMIT 1
    `;
    if (items.length === 0) {
      return fail(res, 404, '商品不存在');
    }

    const rows = await sql`
      INSERT INTO reports (item_id, reporter_id, reason)
      VALUES (${itemId}::uuid, ${userId}::uuid, ${reason})
      RETURNING id
    `;

    return ok(res, { id: rows[0].id }, '举报已提交', 201);
  } catch (err) {
    return handleError(res, err);
  }
};

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
