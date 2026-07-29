/**
 * PATCH /api/messages/[id] — 选为买家（需鉴权，仅卖家；商品须为 on_sale）
 * 将留言 is_selected=true，同商品其它留言取消选中，商品 status → reserved
 */
const { sql } = require('../_lib/db');
const { verifyToken } = require('../_lib/auth');
const { mapMessage, mapItem, ok, fail, handleError } = require('../_lib/response');

/**
 * @param {import('http').IncomingMessage & { method?: string, query?: Record<string, string | string[]>, body?: unknown }} req
 * @param {import('http').ServerResponse} res
 */
module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'PATCH') {
      res.setHeader('Allow', 'PATCH');
      return fail(res, 405, '方法不允许');
    }

    const messageId = pickId(req);
    if (!messageId) {
      return fail(res, 400, '缺少留言 id');
    }

    return await selectBuyer(req, res, messageId);
  } catch (err) {
    return handleError(res, err);
  }
};

/**
 * @param {import('http').IncomingMessage & { body?: unknown }} req
 * @param {import('http').ServerResponse} res
 * @param {string} messageId
 */
async function selectBuyer(req, res, messageId) {
  const userId = verifyToken(req);

  const rows = await sql`
    SELECT
      m.id AS message_id,
      m.item_id,
      m.sender_id,
      m.content,
      m.is_selected,
      m.created_at,
      i.seller_id,
      i.status AS item_status
    FROM messages m
    INNER JOIN items i ON i.id = m.item_id
    WHERE m.id = ${messageId}::uuid
    LIMIT 1
  `;

  if (rows.length === 0) {
    return fail(res, 404, '留言不存在');
  }

  const row = rows[0];
  if (row.seller_id !== userId) {
    return fail(res, 403, '仅商品所属卖家可选择买家');
  }
  if (row.item_status !== 'on_sale') {
    return fail(res, 400, '仅在售商品可选择买家');
  }

  const itemId = row.item_id;

  await sql`
    UPDATE messages
    SET is_selected = false
    WHERE item_id = ${itemId}::uuid AND id <> ${messageId}::uuid AND is_selected = true
  `;

  await sql`
    UPDATE messages
    SET is_selected = true
    WHERE id = ${messageId}::uuid
  `;

  await sql`
    UPDATE items
    SET status = 'reserved'::item_status, updated_at = now()
    WHERE id = ${itemId}::uuid
  `;

  const messageRows = await sql`
    SELECT
      m.id,
      m.item_id,
      m.sender_id,
      m.content,
      m.is_selected,
      m.created_at,
      u.username AS sender_username
    FROM messages m
    LEFT JOIN users u ON u.id = m.sender_id
    WHERE m.id = ${messageId}::uuid
    LIMIT 1
  `;

  const itemRows = await sql`
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
    WHERE i.id = ${itemId}::uuid
    LIMIT 1
  `;

  return ok(
    res,
    {
      message: mapMessage(messageRows[0]),
      item: mapItem(itemRows[0]),
    },
    '已选为买家，商品状态更新为已预订',
  );
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
