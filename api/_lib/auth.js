/**
 * 鉴权工具：密码哈希与 JWT 签发/校验。
 * 需要鉴权的接口统一从此处引入 verifyToken，禁止在各接口内重复实现 JWT 逻辑。
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 10;
const TOKEN_EXPIRES_IN = '7d';

/**
 * 对明文密码进行哈希。
 * @param {string} password - 明文密码
 * @returns {Promise<string>} 密码哈希
 */
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 校验明文密码与哈希是否匹配。
 * @param {string} password - 明文密码
 * @param {string} passwordHash - 已存储的密码哈希
 * @returns {Promise<boolean>} 是否匹配
 */
async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

/**
 * 为用户签发 JWT。
 * @param {string} userId - 用户 UUID
 * @returns {string} JWT 字符串
 */
function generateToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return jwt.sign({ userId }, secret, { expiresIn: TOKEN_EXPIRES_IN });
}

/**
 * 从请求头解析并校验 Bearer Token，返回 userId。
 * @param {import('http').IncomingMessage & { headers: Record<string, string | string[] | undefined> }} req - 请求对象
 * @returns {string} 当前用户 ID
 * @throws {{ statusCode: number, message: string }} 鉴权失败时抛出 401
 */
function verifyToken(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;
  const headerValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;

  if (!headerValue || typeof headerValue !== 'string' || !headerValue.startsWith('Bearer ')) {
    const err = new Error('未授权：缺少或无效的 Authorization 头');
    err.statusCode = 401;
    throw err;
  }

  const token = headerValue.slice(7).trim();
  if (!token) {
    const err = new Error('未授权：Token 为空');
    err.statusCode = 401;
    throw err;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('服务器配置错误：JWT_SECRET 未设置');
    err.statusCode = 500;
    throw err;
  }

  try {
    const payload = jwt.verify(token, secret);
    if (!payload || !payload.userId) {
      const err = new Error('未授权：Token 无效');
      err.statusCode = 401;
      throw err;
    }
    return payload.userId;
  } catch (e) {
    if (e.statusCode) throw e;
    const err = new Error('未授权：Token 无效或已过期');
    err.statusCode = 401;
    throw err;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
};
