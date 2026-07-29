/**
 * 以 Vercel Serverless handler 风格调用接口，收集 JSON 响应。
 * @param {(req: object, res: object) => Promise<unknown> | unknown} handler
 * @param {{ method: string, body?: object, headers?: Record<string, string>, query?: Record<string, string> }} options
 * @returns {Promise<{ statusCode: number, body: object, headers: Record<string, string> }>}
 */
async function invoke(handler, options) {
  const { method, body, headers = {}, query = {} } = options;

  /** @type {Record<string, string>} */
  const resHeaders = {};

  const req = {
    method,
    body: body ?? undefined,
    headers: { ...headers },
    query: { ...query },
  };

  return new Promise((resolve, reject) => {
    let settled = false;

    const res = {
      statusCode: 200,
      /**
       * @param {string} key
       * @param {string} value
       */
      setHeader(key, value) {
        resHeaders[key.toLowerCase()] = value;
      },
      /**
       * @param {string} chunk
       */
      end(chunk) {
        if (settled) return;
        settled = true;
        let parsed = null;
        if (chunk != null && chunk !== '') {
          try {
            parsed = JSON.parse(String(chunk));
          } catch (err) {
            reject(err);
            return;
          }
        }
        resolve({
          statusCode: res.statusCode,
          body: parsed,
          headers: resHeaders,
        });
      },
    };

    Promise.resolve(handler(req, res)).catch((err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    });
  });
}

/**
 * 生成测试用唯一用户名。
 * @param {string} [prefix='u']
 * @returns {string}
 */
function uniqueUsername(prefix = 'u') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 测试用固定密码 */
const TEST_PASSWORD = 'testpass123';

/**
 * @returns {boolean}
 */
function isEnvReady() {
  return Boolean(globalThis.__API_TEST_ENV_OK__);
}

module.exports = {
  invoke,
  uniqueUsername,
  TEST_PASSWORD,
  isEnvReady,
};
