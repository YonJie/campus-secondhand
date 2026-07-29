/**
 * GET /api/items/[id] — 商品详情（联表卖家用户名、分类名称）
 * PATCH /api/items/[id] — 更新商品（需鉴权，仅卖家）
 */
const { sql } = require('../_lib/db');
const { verifyToken } = require('../_lib/auth');
const { mapItem, ok, fail, handleError, ITEM_STATUSES } = require('../_lib/response');

/**
 * @param {import('http').IncomingMessage & { method?: string, query?: Record<string, string | string[]>, body?: unknown }} req
 * @param {import('http').ServerResponse} res
 */
module.exports = async function handler(req, res) {
  try {
    const id = pickId(req);
    if (!id) {
      return fail(res, 400, '缺少商品 id');
    }

    if (req.method === 'GET') {
      return await getItem(res, id);
    }
    if (req.method === 'PATCH') {
      return await patchItem(req, res, id);
    }
    res.setHeader('Allow', 'GET, PATCH');
    return fail(res, 405, '方法不允许');
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * @param {import('http').ServerResponse} res
 * @param {string} id
 */
async function getItem(res, id) {
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
    FROM items i
    LEFT JOIN users u ON u.id = i.seller_id
    LEFT JOIN categories c ON c.id = i.category_id
    WHERE i.id = ${id}::uuid
    LIMIT 1
  `;

  if (rows.length === 0) {
    return fail(res, 404, '商品不存在');
  }

  return ok(res, mapItem(rows[0]));
}

/**
 * @param {import('http').IncomingMessage & { body?: unknown }} req
 * @param {import('http').ServerResponse} res
 * @param {string} id
 */
async function patchItem(req, res, id) {
  const userId = verifyToken(req);
  const body = parseBody(req.body);

  const existing = await sql`
    SELECT
      id,
      seller_id,
      title,
      description,
      price,
      category_id,
      status,
      image_url
    FROM items
    WHERE id = ${id}::uuid
    LIMIT 1
  `;

  if (existing.length === 0) {
    return fail(res, 404, '商品不存在');
  }

  const item = existing[0];
  if (item.seller_id !== userId) {
    return fail(res, 403, '仅商品所属卖家可修改');
  }

  const next = {
    title: item.title,
    description: item.description,
    price: item.price,
    category_id: item.category_id,
    image_url: item.image_url,
    status: item.status,
  };

  if (body.title !== undefined) {
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) {
      return fail(res, 400, '标题不能为空');
    }
    next.title = title;
  }

  if (body.description !== undefined) {
    next.description =
      body.description === null ? null : String(body.description);
  }

  if (body.price !== undefined) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price <= 0) {
      return fail(res, 400, '价格必须大于 0');
    }
    next.price = price;
  }

  if (body.categoryId !== undefined) {
    if (body.categoryId === null || body.categoryId === '') {
      next.category_id = null;
    } else {
      const cats = await sql`
        SELECT id FROM categories WHERE id = ${String(body.categoryId)}::uuid LIMIT 1
      `;
      if (cats.length === 0) {
        return fail(res, 400, '分类不存在');
      }
      next.category_id = String(body.categoryId);
    }
  }

  if (body.imageUrl !== undefined) {
    next.image_url = body.imageUrl === null ? null : String(body.imageUrl);
  }

  if (body.status !== undefined) {
    const status = String(body.status);
    if (!ITEM_STATUSES.includes(status)) {
      return fail(res, 400, `status 无效，可选值：${ITEM_STATUSES.join(', ')}`);
    }
    next.status = status;
  }

  const updated = await sql`
    UPDATE items
    SET
      title = ${next.title},
      description = ${next.description},
      price = ${next.price},
      category_id = ${next.category_id}::uuid,
      image_url = ${next.image_url},
      status = ${next.status}::item_status,
      updated_at = now()
    WHERE id = ${id}::uuid
    RETURNING id
  `;

  if (updated.length === 0) {
    return fail(res, 404, '商品不存在');
  }

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
    FROM items i
    LEFT JOIN users u ON u.id = i.seller_id
    LEFT JOIN categories c ON c.id = i.category_id
    WHERE i.id = ${id}::uuid
    LIMIT 1
  `;

  return ok(res, mapItem(rows[0]), '更新成功');
}

/**
 * @param {{ query?: Record<string, string | string[]> }} req
 * @returns {string}
 */
function pickId(req) {
  const v = req.query?.id;
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
