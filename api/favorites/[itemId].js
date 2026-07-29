/**
 * POST /api/favorites/[itemId] — 收藏（需鉴权，幂等）
 * DELETE /api/favorites/[itemId] — 取消收藏（需鉴权）
 */
const { sql } = require('../_lib/db');
const { verifyToken } = require('../_lib/auth');
const { ok, fail, handleError } = require('../_lib/response');

/**
 * @param {import('http').IncomingMessage & { method?: string, query?: Record<string, string | string[]> }} req
 * @param {import('http').ServerResponse} res
 */
module.exports = async function handler(req, res) {
  try {
    const itemId = pickItemId(req);
    if (!itemId) {
      return fail(res, 400, '缺少商品 id');
    }

    if (req.method === 'POST') {
      return await addFavorite(req, res, itemId);
    }
    if (req.method === 'DELETE') {
      return await removeFavorite(req, res, itemId);
    }
    res.setHeader('Allow', 'POST, DELETE');
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
async function addFavorite(req, res, itemId) {
  const userId = verifyToken(req);

  const items = await sql`
    SELECT id FROM items WHERE id = ${itemId}::uuid LIMIT 1
  `;
  if (items.length === 0) {
    return fail(res, 404, '商品不存在');
  }

  await sql`
    INSERT INTO favorites (user_id, item_id)
    VALUES (${userId}::uuid, ${itemId}::uuid)
    ON CONFLICT (user_id, item_id) DO NOTHING
  `;

  return ok(res, null, '已收藏');
}

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 * @param {string} itemId
 */
async function removeFavorite(req, res, itemId) {
  const userId = verifyToken(req);

  await sql`
    DELETE FROM favorites
    WHERE user_id = ${userId}::uuid AND item_id = ${itemId}::uuid
  `;

  return ok(res, null, '已取消收藏');
}

/**
 * @param {{ query?: Record<string, string | string[]> }} req
 * @returns {string}
 */
function pickItemId(req) {
  const v = req.query?.itemId;
  if (Array.isArray(v)) return (v[0] || '').trim();
  return (v || '').trim();
}
