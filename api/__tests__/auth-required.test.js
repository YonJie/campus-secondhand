/**
 * 未登录访问需鉴权接口应返回 401
 * （vitest globals：describe / it / expect）
 */
const itemsHandler = require('../items/index');
const { invoke, isEnvReady } = require('./helpers/invoke');

describe.skipIf(!isEnvReady())('auth required', () => {
  it('无 Authorization 发布商品返回 401', async () => {
    const res = await invoke(itemsHandler, {
      method: 'POST',
      body: {
        title: '未登录发布测试',
        price: 9.9,
      },
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBeTruthy();
  });
});
