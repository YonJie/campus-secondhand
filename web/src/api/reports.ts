import request from '../utils/request'
import type { ApiResponse } from '../types'

/**
 * 提交举报
 * @param itemId 商品 ID
 * @param reason 理由
 */
export function submitReport(
  itemId: string,
  reason: string,
): Promise<ApiResponse<{ id: string }>> {
  return request.post('/reports', { itemId, reason }) as Promise<
    ApiResponse<{ id: string }>
  >
}
