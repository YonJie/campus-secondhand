import request from '../utils/request'
import { USE_MOCK, delay } from '../utils/mock'
import { MOCK_USER, mockId, mockItems, mockMessages } from '../mock/data'
import type { ApiResponse, Item, Message } from '../types'
import { useUserStore } from '../stores/user'

/**
 * 获取商品留言列表
 * @param itemId 商品 ID
 */
export async function fetchMessages(
  itemId: string,
): Promise<ApiResponse<Message[]>> {
  if (USE_MOCK) {
    await delay()
    const list = mockMessages
      .filter((m) => m.itemId === itemId)
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    return { success: true, data: list.map((m) => ({ ...m })) }
  }
  return request.get(`/items/${itemId}/messages`) as Promise<ApiResponse<Message[]>>
}

/**
 * 发表留言
 * @param itemId 商品 ID
 * @param content 内容
 */
export async function postMessage(
  itemId: string,
  content: string,
): Promise<ApiResponse<Message>> {
  if (USE_MOCK) {
    await delay()
    if (!content.trim()) {
      return {
        success: false,
        data: null as unknown as Message,
        message: '留言内容不能为空',
      }
    }
    const userStore = useUserStore()
    const msg: Message = {
      id: mockId('msg'),
      itemId,
      senderId: userStore.userInfo?.id || MOCK_USER.id,
      senderUsername: userStore.userInfo?.username || '访客',
      content: content.trim(),
      isSelected: false,
      createdAt: new Date().toISOString(),
    }
    mockMessages.push(msg)
    return { success: true, data: msg, message: '留言成功' }
  }
  return request.post(`/items/${itemId}/messages`, { content }) as Promise<
    ApiResponse<Message>
  >
}

/**
 * 选为买家：标记留言 isSelected，并将商品状态改为 reserved
 * @param messageId 留言 ID
 */
export async function selectBuyer(
  messageId: string,
): Promise<ApiResponse<{ message: Message; item: Item }>> {
  if (USE_MOCK) {
    await delay()
    const msg = mockMessages.find((m) => m.id === messageId)
    if (!msg) {
      return {
        success: false,
        data: null as unknown as { message: Message; item: Item },
        message: '留言不存在',
      }
    }
    const item = mockItems.find((i) => i.id === msg.itemId)
    if (!item) {
      return {
        success: false,
        data: null as unknown as { message: Message; item: Item },
        message: '商品不存在',
      }
    }
    const userId = useUserStore().userInfo?.id
    if (item.sellerId !== userId) {
      return {
        success: false,
        data: null as unknown as { message: Message; item: Item },
        message: '仅卖家可选择买家',
      }
    }
    mockMessages.forEach((m) => {
      if (m.itemId === item.id) m.isSelected = m.id === messageId
    })
    msg.isSelected = true
    item.status = 'reserved'
    item.updatedAt = new Date().toISOString()
    return {
      success: true,
      data: { message: { ...msg }, item: { ...item } },
      message: '已选为买家，商品状态更新为已预订',
    }
  }
  return request.patch(`/messages/${messageId}`, { isSelected: true }) as Promise<
    ApiResponse<{ message: Message; item: Item }>
  >
}
