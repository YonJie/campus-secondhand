/**
 * 测试入口：加载根目录 .env，并标记环境是否就绪。
 */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envOk = Boolean(process.env.DATABASE_URL && process.env.JWT_SECRET);

if (!envOk) {
  console.warn(
    '[api tests] 缺少 DATABASE_URL 或 JWT_SECRET，核心链路集成测试将跳过。请在仓库根目录配置 .env',
  );
}

/** @type {boolean} 环境变量是否足以跑真实 DB 集成测试 */
globalThis.__API_TEST_ENV_OK__ = envOk;
