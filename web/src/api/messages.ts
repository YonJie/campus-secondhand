import request, { type AppRequestConfig } from '../utils/request'
import type { ApiResponse, Item, Message } from '../types'

/**
 * 获取商品留言列表
 * @param itemId 商品 ID
 */
export function fetchMessages(itemId: string): Promise<ApiResponse<Message[]>> {
  return request.get(`/items/${itemId}/messages`, {
    silentError: true,
  } as AppRequestConfig) as Promise<ApiResponse<Message[]>>
}

/**
 * 发表留言
 * @param itemId 商品 ID
 * @param content 内容
 */
export function postMessage(
  itemId: string,
  content: string,
): Promise<ApiResponse<Message>> {
  return request.post(`/items/${itemId}/messages`, { content }) as Promise<
    ApiResponse<Message>
  >
}

/**
 * 选为买家
 * @param messageId 留言 ID
 */
export function selectBuyer(
  messageId: string,
): Promise<ApiResponse<{ message: Message; item: Item }>> {
  return request.patch(`/messages/${messageId}`, { isSelected: true }) as Promise<
    ApiResponse<{ message: Message; item: Item }>
  >
}
