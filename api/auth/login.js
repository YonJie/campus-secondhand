/**
 * POST /api/auth/login — 用户登录
 */
const { sql } = require('../_lib/db');
const { verifyPassword, generateToken } = require('../_lib/auth');
const { mapUser, ok, fail, handleError } = require('../_lib/response');

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

    const body = parseBody(req.body);
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!username || !password) {
      return fail(res, 400, '用户名和密码不能为空');
    }

    const rows = await sql`
      SELECT id, username, password_hash, avatar_url, created_at
      FROM users
      WHERE username = ${username}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return fail(res, 401, '用户名或密码错误');
    }

    const row = rows[0];
    const matched = await verifyPassword(password, row.password_hash);
    if (!matched) {
      return fail(res, 401, '用户名或密码错误');
    }

    const user = mapUser(row);
    const token = generateToken(user.id);

    return ok(res, { token, user }, '登录成功');
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
