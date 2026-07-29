import request from '../utils/request'
import type { ApiResponse, Item } from '../types'

/**
 * 我的收藏列表
 */
export function fetchFavorites(): Promise<ApiResponse<Item[]>> {
  return request.get('/favorites') as Promise<ApiResponse<Item[]>>
}

/**
 * 收藏商品（幂等）
 * @param itemId 商品 ID
 */
export function addFavorite(itemId: string): Promise<ApiResponse<null>> {
  return request.post(`/favorites/${itemId}`) as Promise<ApiResponse<null>>
}

/**
 * 取消收藏
 * @param itemId 商品 ID
 */
export function removeFavorite(itemId: string): Promise<ApiResponse<null>> {
  return request.delete(`/favorites/${itemId}`) as Promise<ApiResponse<null>>
}
