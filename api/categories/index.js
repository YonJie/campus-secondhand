/**
 * GET /api/categories — 分类列表
 */
const { sql } = require('../_lib/db');
const { ok, fail, handleError } = require('../_lib/response');

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

    const rows = await sql`
      SELECT id, name
      FROM categories
      ORDER BY name ASC
    `;

    const list = rows.map((row) => ({
      id: row.id,
      name: row.name,
    }));

    return ok(res, list);
  } catch (err) {
    return handleError(res, err);
  }
};
