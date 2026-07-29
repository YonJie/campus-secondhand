/**
 * 发布商品后能在列表接口查到
 * （vitest globals：describe / it / expect）
 */
const registerHandler = require('../auth/register');
const itemsHandler = require('../items/index');
const { invoke, uniqueUsername, TEST_PASSWORD, isEnvReady } = require('./helpers/invoke');

describe.skipIf(!isEnvReady())('item publish then list', () => {
  it('卖家发布后可在公开列表中按 keyword 查到', async () => {
    const username = uniqueUsername('seller');
    const title = `测试商品_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const reg = await invoke(registerHandler, {
      method: 'POST',
      body: { username, password: TEST_PASSWORD },
    });
    expect(reg.statusCode).toBe(201);
    const token = reg.body.data.token;

    const created = await invoke(itemsHandler, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}` },
      body: {
        title,
        price: 12.5,
        description: '轻量测试发布',
      },
    });

    expect(created.statusCode).toBe(201);
    expect(created.body.success).toBe(true);
    const itemId = created.body.data.id;
    expect(itemId).toBeTruthy();
    expect(created.body.data.status).toBe('on_sale');

    const list = await invoke(itemsHandler, {
      method: 'GET',
      query: { keyword: title, pageSize: '20' },
    });

    expect(list.statusCode).toBe(200);
    expect(list.body.success).toBe(true);
    const found = list.body.data.list.find((item) => item.id === itemId);
    expect(found).toBeTruthy();
    expect(found.title).toBe(title);
  });
});
