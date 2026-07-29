/**
 * 注册 + 登录流程：拿到合法 token
 * （vitest globals：describe / it / expect）
 */
const registerHandler = require('../auth/register');
const loginHandler = require('../auth/login');
const { invoke, uniqueUsername, TEST_PASSWORD, isEnvReady } = require('./helpers/invoke');

describe.skipIf(!isEnvReady())('auth flow: register + login', () => {
  it('注册后登录均返回非空 JWT token', async () => {
    const username = uniqueUsername('auth');

    const reg = await invoke(registerHandler, {
      method: 'POST',
      body: { username, password: TEST_PASSWORD },
    });

    expect(reg.statusCode).toBe(201);
    expect(reg.body.success).toBe(true);
    expect(reg.body.data.user.username).toBe(username);
    expect(typeof reg.body.data.token).toBe('string');
    expect(reg.body.data.token.split('.')).toHaveLength(3);

    const login = await invoke(loginHandler, {
      method: 'POST',
      body: { username, password: TEST_PASSWORD },
    });

    expect(login.statusCode).toBe(200);
    expect(login.body.success).toBe(true);
    expect(login.body.data.user.username).toBe(username);
    expect(typeof login.body.data.token).toBe('string');
    expect(login.body.data.token.split('.')).toHaveLength(3);
  });
});
