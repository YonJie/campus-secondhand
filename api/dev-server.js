/**
 * 本地 API 开发服务器：将 /api/* 路由到 Serverless handler，默认监听 3000。
 * 供 Vite 代理联调使用：在仓库根目录配置好 .env 后执行 `npm run dev`（于 api/）。
 */
const http = require('http');
const { URL } = require('url');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = Number(process.env.API_PORT || 3000);

const registerHandler = require('./auth/register');
const loginHandler = require('./auth/login');
const categoriesHandler = require('./categories/index');
const itemsHandler = require('./items/index');
const itemByIdHandler = require('./items/[id]');
const itemMessagesHandler = require('./items/[id]/messages');
const messageByIdHandler = require('./messages/[id]');
const favoritesHandler = require('./favorites/index');
const favoriteByItemHandler = require('./favorites/[itemId]');
const reportsHandler = require('./reports');

/**
 * @typedef {{ handler: Function, query?: Record<string, string> }} RouteMatch
 */

/**
 * 根据 pathname 匹配 handler，并注入动态路由 query。
 * @param {string} pathname
 * @returns {RouteMatch | null}
 */
function matchRoute(pathname) {
  const p = pathname.replace(/\/+$/, '') || '/';

  if (p === '/api/auth/register') return { handler: registerHandler };
  if (p === '/api/auth/login') return { handler: loginHandler };
  if (p === '/api/categories') return { handler: categoriesHandler };
  if (p === '/api/items') return { handler: itemsHandler };
  if (p === '/api/favorites') return { handler: favoritesHandler };
  if (p === '/api/reports') return { handler: reportsHandler };

  let m = p.match(/^\/api\/items\/([^/]+)\/messages$/);
  if (m) return { handler: itemMessagesHandler, query: { id: m[1] } };

  m = p.match(/^\/api\/items\/([^/]+)$/);
  if (m) return { handler: itemByIdHandler, query: { id: m[1] } };

  m = p.match(/^\/api\/messages\/([^/]+)$/);
  if (m) return { handler: messageByIdHandler, query: { id: m[1] } };

  m = p.match(/^\/api\/favorites\/([^/]+)$/);
  if (m) return { handler: favoriteByItemHandler, query: { itemId: m[1] } };

  return null;
}

/**
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<unknown>}
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(raw);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const host = req.headers.host || `localhost:${PORT}`;
    const url = new URL(req.url || '/', `http://${host}`);
    const matched = matchRoute(url.pathname);

    if (!matched) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ success: false, data: null, message: '接口不存在' }));
      return;
    }

    /** @type {Record<string, string>} */
    const query = { ...(matched.query || {}) };
    url.searchParams.forEach((value, key) => {
      query[key] = value;
    });

    const body = ['GET', 'HEAD'].includes(req.method || 'GET')
      ? undefined
      : await readBody(req);

    /** @type {import('http').IncomingMessage & { body?: unknown, query?: Record<string, string> }} */
    const vercelReq = Object.assign(req, {
      body,
      query,
    });

    await matched.handler(vercelReq, res);
  } catch (err) {
    console.error('[dev-api]', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ success: false, data: null, message: '服务器内部错误' }));
    }
  }
});

server.listen(PORT, () => {
  const hasDb = Boolean(process.env.DATABASE_URL);
  const hasJwt = Boolean(process.env.JWT_SECRET);
  console.log(`[dev-api] http://localhost:${PORT}`);
  console.log(`[dev-api] DATABASE_URL: ${hasDb ? '已加载' : '缺失'}`);
  console.log(`[dev-api] JWT_SECRET: ${hasJwt ? '已加载' : '缺失'}`);
  if (!hasDb || !hasJwt) {
    console.warn('[dev-api] 请在仓库根目录配置 .env 后再调用需数据库/鉴权的接口');
  }
});
