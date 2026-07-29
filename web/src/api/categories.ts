import request from '../utils/request'
import { USE_MOCK, delay } from '../utils/mock'
import { MOCK_CATEGORIES } from '../mock/data'
import type { ApiResponse, Category } from '../types'

/**
 * 获取分类列表
 */
export async function fetchCategories(): Promise<ApiResponse<Category[]>> {
  if (USE_MOCK) {
    await delay(120)
    return { success: true, data: [...MOCK_CATEGORIES] }
  }
  return request.get('/categories') as Promise<ApiResponse<Category[]>>
}
