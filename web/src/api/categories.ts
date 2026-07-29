import request from '../utils/request'
import type { ApiResponse, Category } from '../types'

/**
 * 获取分类列表
 */
export function fetchCategories(): Promise<ApiResponse<Category[]>> {
  return request.get('/categories') as Promise<ApiResponse<Category[]>>
}
