import request from '../utils/request'
import { USE_MOCK, delay } from '../utils/mock'
import type { ApiResponse } from '../types'

/**
 * 提交举报
 * @param itemId 商品 ID
 * @param reason 理由
 */
export async function submitReport(
  itemId: string,
  reason: string,
): Promise<ApiResponse<{ id: string }>> {
  if (USE_MOCK) {
    await delay()
    if (!reason.trim()) {
      return {
        success: false,
        data: null as unknown as { id: string },
        message: '请填写举报理由',
      }
    }
    return {
      success: true,
      data: { id: `report-${Date.now()}` },
      message: '举报已提交',
    }
  }
  return request.post('/reports', { itemId, reason }) as Promise<
    ApiResponse<{ id: string }>
  >
}
