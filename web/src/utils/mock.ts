/**
 * Mock 开关：后端就绪后改为 false 即可联调真实接口
 */
export const USE_MOCK = true

/**
 * 模拟网络延迟
 * @param ms 毫秒
 */
export function delay(ms = 280): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
