/**
 * POST /api/auth/register — 用户注册
 */
const { sql } = require('../_lib/db');
const { hashPassword, generateToken } = require('../_lib/auth');
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

    if (!username) {
      return fail(res, 400, '用户名不能为空');
    }
    if (username.length < 2 || username.length > 64) {
      return fail(res, 400, '用户名长度须为 2–64 个字符');
    }
    if (!password || password.length < 6) {
      return fail(res, 400, '密码至少 6 位');
    }

    const existing = await sql`
      SELECT id FROM users WHERE username = ${username} LIMIT 1
    `;
    if (existing.length > 0) {
      return fail(res, 409, '用户名已存在');
    }

    const passwordHash = await hashPassword(password);
    const rows = await sql`
      INSERT INTO users (username, password_hash)
      VALUES (${username}, ${passwordHash})
      RETURNING id, username, avatar_url, created_at
    `;

    const user = mapUser(rows[0]);
    const token = generateToken(user.id);

    return ok(res, { token, user }, '注册成功', 201);
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
