/**
 * GET /api/items — 商品列表（关键字/分类/状态/分页）
 * POST /api/items — 创建商品（需鉴权）
 */
const { sql } = require('../_lib/db');
const { verifyToken } = require('../_lib/auth');
const { mapItem, ok, fail, handleError, ITEM_STATUSES } = require('../_lib/response');

const DEFAULT_STATUSES = ['on_sale', 'reserved'];
const MAX_PAGE_SIZE = 50;

/**
 * @param {import('http').IncomingMessage & { method?: string, query?: Record<string, string | string[]>, body?: unknown }} req
 * @param {import('http').ServerResponse} res
 */
module.exports = async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      return await listItems(req, res);
    }
    if (req.method === 'POST') {
      return await createItem(req, res);
    }
    res.setHeader('Allow', 'GET, POST');
    return fail(res, 405, '方法不允许');
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * 商品列表。
 * @param {import('http').IncomingMessage & { query?: Record<string, string | string[]> }} req
 * @param {import('http').ServerResponse} res
 */
async function listItems(req, res) {
  const q = req.query || {};
  const keyword = pickQuery(q, 'keyword');
  const categoryId = pickQuery(q, 'categoryId');
  const status = pickQuery(q, 'status');
  const page = Math.max(1, parseInt(pickQuery(q, 'page') || '1', 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(pickQuery(q, 'pageSize') || '10', 10) || 10),
  );
  const offset = (page - 1) * pageSize;

  if (status && !ITEM_STATUSES.includes(status)) {
    return fail(res, 400, `status 无效，可选值：${ITEM_STATUSES.join(', ')}`);
  }

  const statuses = status ? [status] : DEFAULT_STATUSES;
  const keywordPattern = keyword ? `%${keyword}%` : null;
  const categoryFilter = categoryId || null;

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
      c.name AS category_name,
      COUNT(*) OVER()::int AS total_count
    FROM items i
    LEFT JOIN users u ON u.id = i.seller_id
    LEFT JOIN categories c ON c.id = i.category_id
    WHERE i.status = ANY(${statuses}::item_status[])
      AND (${keywordPattern}::text IS NULL OR i.title ILIKE ${keywordPattern})
      AND (${categoryFilter}::uuid IS NULL OR i.category_id = ${categoryFilter}::uuid)
    ORDER BY i.created_at DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
  const list = rows.map((row) => {
    const { total_count: _tc, ...rest } = row;
    return mapItem(rest);
  });

  return ok(res, {
    list,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 0,
    },
  });
}

/**
 * 创建商品。
 * @param {import('http').IncomingMessage & { body?: unknown }} req
 * @param {import('http').ServerResponse} res
 */
async function createItem(req, res) {
  const userId = verifyToken(req);
  const body = parseBody(req.body);

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const priceRaw = body.price;
  const price = priceRaw !== undefined && priceRaw !== null ? Number(priceRaw) : NaN;

  if (!title) {
    return fail(res, 400, '标题不能为空');
  }
  if (!Number.isFinite(price) || price <= 0) {
    return fail(res, 400, '价格必填且必须大于 0');
  }

  const description =
    body.description !== undefined && body.description !== null
      ? String(body.description)
      : null;
  const categoryId = body.categoryId || null;
  const imageUrl =
    body.imageUrl !== undefined && body.imageUrl !== null ? String(body.imageUrl) : null;

  const duplicates = await sql`
    SELECT id
    FROM items
    WHERE seller_id = ${userId}
      AND title = ${title}
      AND created_at > now() - interval '5 minutes'
    LIMIT 1
  `;
  if (duplicates.length > 0) {
    return fail(res, 409, '5 分钟内不能重复发布相同标题的商品');
  }

  if (categoryId) {
    const cats = await sql`SELECT id FROM categories WHERE id = ${categoryId}::uuid LIMIT 1`;
    if (cats.length === 0) {
      return fail(res, 400, '分类不存在');
    }
  }

  const rows = await sql`
    INSERT INTO items (seller_id, title, description, price, category_id, image_url)
    VALUES (
      ${userId}::uuid,
      ${title},
      ${description},
      ${price},
      ${categoryId}::uuid,
      ${imageUrl}
    )
    RETURNING
      id,
      seller_id,
      title,
      description,
      price,
      category_id,
      status,
      image_url,
      created_at,
      updated_at
  `;

  const item = rows[0];
  const joined = await sql`
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
    FROM items i
    LEFT JOIN users u ON u.id = i.seller_id
    LEFT JOIN categories c ON c.id = i.category_id
    WHERE i.id = ${item.id}
  `;

  return ok(res, mapItem(joined[0]), '创建成功', 201);
}

/**
 * @param {Record<string, string | string[] | undefined>} query
 * @param {string} key
 * @returns {string}
 */
function pickQuery(query, key) {
  const v = query[key];
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
