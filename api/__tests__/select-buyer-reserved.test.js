/**
 * 卖家选定留言后，商品状态应变为 reserved
 * （vitest globals：describe / it / expect）
 */
const registerHandler = require('../auth/register');
const itemsHandler = require('../items/index');
const messagesHandler = require('../items/[id]/messages');
const selectBuyerHandler = require('../messages/[id]');
const { invoke, uniqueUsername, TEST_PASSWORD, isEnvReady } = require('./helpers/invoke');

describe.skipIf(!isEnvReady())('select buyer → reserved', () => {
  it('卖家选中留言后商品 status 为 reserved', async () => {
    const sellerName = uniqueUsername('seller');
    const buyerName = uniqueUsername('buyer');
    const title = `预订测试_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const sellerReg = await invoke(registerHandler, {
      method: 'POST',
      body: { username: sellerName, password: TEST_PASSWORD },
    });
    expect(sellerReg.statusCode).toBe(201);
    const sellerToken = sellerReg.body.data.token;

    const buyerReg = await invoke(registerHandler, {
      method: 'POST',
      body: { username: buyerName, password: TEST_PASSWORD },
    });
    expect(buyerReg.statusCode).toBe(201);
    const buyerToken = buyerReg.body.data.token;

    const created = await invoke(itemsHandler, {
      method: 'POST',
      headers: { authorization: `Bearer ${sellerToken}` },
      body: { title, price: 30, description: '选买家测试' },
    });
    expect(created.statusCode).toBe(201);
    const itemId = created.body.data.id;

    const msg = await invoke(messagesHandler, {
      method: 'POST',
      headers: { authorization: `Bearer ${buyerToken}` },
      query: { id: itemId },
      body: { content: '我想要，可以当面交易吗？' },
    });
    expect(msg.statusCode).toBe(201);
    const messageId = msg.body.data.id;
    expect(messageId).toBeTruthy();

    const selected = await invoke(selectBuyerHandler, {
      method: 'PATCH',
      headers: { authorization: `Bearer ${sellerToken}` },
      query: { id: messageId },
      body: { isSelected: true },
    });

    expect(selected.statusCode).toBe(200);
    expect(selected.body.success).toBe(true);
    expect(selected.body.data.message.isSelected).toBe(true);
    expect(selected.body.data.item.status).toBe('reserved');
    expect(selected.body.data.item.id).toBe(itemId);
  });
});
