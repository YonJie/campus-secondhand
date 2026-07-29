import request from '../utils/request'
import type {
  ApiResponse,
  Item,
  ItemFormPayload,
  ItemListQuery,
  Paginated,
} from '../types'

/**
 * 商品列表（搜索 / 分类 / 分页 / 我的发布）
 * @param query 查询参数
 */
export function fetchItems(
  query: ItemListQuery = {},
): Promise<ApiResponse<Paginated<Item>>> {
  const params: Record<string, string | number | boolean> = {}
  if (query.keyword) params.keyword = query.keyword
  if (query.categoryId) params.categoryId = query.categoryId
  if (query.status) params.status = query.status
  if (query.page) params.page = query.page
  if (query.pageSize) params.pageSize = query.pageSize
  if (query.mine) params.mine = true

  return request.get('/items', { params }) as Promise<ApiResponse<Paginated<Item>>>
}

/**
 * 商品详情
 * @param id 商品 ID
 */
export function fetchItemDetail(id: string): Promise<ApiResponse<Item>> {
  return request.get(`/items/${id}`) as Promise<ApiResponse<Item>>
}

/**
 * 发布商品
 * @param payload 表单
 */
export function createItem(payload: ItemFormPayload): Promise<ApiResponse<Item>> {
  return request.post('/items', payload) as Promise<ApiResponse<Item>>
}

/**
 * 更新商品（基本信息或状态）
 * @param id 商品 ID
 * @param payload 部分字段
 */
export function updateItem(
  id: string,
  payload: ItemFormPayload,
): Promise<ApiResponse<Item>> {
  return request.patch(`/items/${id}`, payload) as Promise<ApiResponse<Item>>
}
