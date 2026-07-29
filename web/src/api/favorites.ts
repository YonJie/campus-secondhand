import request from '../utils/request'
import { USE_MOCK, delay } from '../utils/mock'
import { mockFavoriteIds, mockItems } from '../mock/data'
import type { ApiResponse, Item } from '../types'

/**
 * 我的收藏列表
 */
export async function fetchFavorites(): Promise<ApiResponse<Item[]>> {
  if (USE_MOCK) {
    await delay()
    const list = mockItems
      .filter((i) => mockFavoriteIds.has(i.id))
      .map((i) => ({ ...i, isFavorited: true }))
    return { success: true, data: list }
  }
  return request.get('/favorites') as Promise<ApiResponse<Item[]>>
}

/**
 * 收藏商品（幂等）
 * @param itemId 商品 ID
 */
export async function addFavorite(itemId: string): Promise<ApiResponse<null>> {
  if (USE_MOCK) {
    await delay(150)
    mockFavoriteIds.add(itemId)
    return { success: true, data: null, message: '已收藏' }
  }
  return request.post(`/favorites/${itemId}`) as Promise<ApiResponse<null>>
}

/**
 * 取消收藏
 * @param itemId 商品 ID
 */
export async function removeFavorite(itemId: string): Promise<ApiResponse<null>> {
  if (USE_MOCK) {
    await delay(150)
    mockFavoriteIds.delete(itemId)
    return { success: true, data: null, message: '已取消收藏' }
  }
  return request.delete(`/favorites/${itemId}`) as Promise<ApiResponse<null>>
}
