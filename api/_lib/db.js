/**
 * Neon Postgres 数据库客户端封装。
 * 统一从环境变量 DATABASE_URL 读取连接串，供 Serverless 接口复用。
 */
const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  console.warn('[db] DATABASE_URL is not set');
}

/** @type {import('@neondatabase/serverless').NeonQueryFunction} */
const sql = neon(process.env.DATABASE_URL);

module.exports = { sql };
