/**
 * GET /api/favorites — 当前用户收藏的商品列表（需鉴权）
 */
const { sql } = require('../_lib/db');
const { verifyToken } = require('../_lib/auth');
const { mapItem, ok, fail, handleError } = require('../_lib/response');

/**
 * @param {import('http').IncomingMessage & { method?: string }} req
 * @param {import('http').ServerResponse} res
 */
module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return fail(res, 405, '方法不允许');
    }

    const userId = verifyToken(req);

    const rows = await sql`
      SELECT
        i.id,
        i.seller_id,
        i.title,
        i.description,
        i.price,
        i.category_id,
        i.status,
        i.image_url,
        i.created_at,
        i.updated_at,
        u.username AS seller_username,
        c.name AS category_name
      FROM favorites f
      INNER JOIN items i ON i.id = f.item_id
      LEFT JOIN users u ON u.id = i.seller_id
      LEFT JOIN categories c ON c.id = i.category_id
      WHERE f.user_id = ${userId}::uuid
      ORDER BY f.created_at DESC
    `;

    const list = rows.map((row) => ({
      ...mapItem(row),
      isFavorited: true,
    }));

    return ok(res, list);
  } catch (err) {
    return handleError(res, err);
  }
};
