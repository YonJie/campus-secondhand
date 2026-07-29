import request from '../utils/request'
import { USE_MOCK, delay } from '../utils/mock'
import {
  MOCK_CATEGORIES,
  MOCK_USER,
  mockFavoriteIds,
  mockId,
  mockItems,
} from '../mock/data'
import type {
  ApiResponse,
  Item,
  ItemFormPayload,
  ItemListQuery,
  ItemStatus,
  Paginated,
} from '../types'
import { useUserStore } from '../stores/user'

/**
 * 当前用户 ID（mock 场景）
 */
function currentUserId(): string {
  return useUserStore().userInfo?.id || MOCK_USER.id
}

/**
 * 商品列表（搜索 / 分类 / 分页 / 我的发布）
 */
export async function fetchItems(
  query: ItemListQuery = {},
): Promise<ApiResponse<Paginated<Item>>> {
  if (USE_MOCK) {
    await delay()
    const page = query.page || 1
    const pageSize = query.pageSize || 8
    let list = [...mockItems]

    if (query.mine) {
      list = list.filter((i) => i.sellerId === currentUserId())
    } else {
      const statusFilter = query.status
        ? query.status.split(',').map((s) => s.trim())
        : ['on_sale', 'reserved']
      list = list.filter((i) => statusFilter.includes(i.status))
    }

    if (query.keyword?.trim()) {
      const kw = query.keyword.trim().toLowerCase()
      list = list.filter((i) => i.title.toLowerCase().includes(kw))
    }
    if (query.categoryId) {
      list = list.filter((i) => i.categoryId === query.categoryId)
    }

    list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    const total = list.length
    const start = (page - 1) * pageSize
    const pageList = list.slice(start, start + pageSize).map((i) => ({
      ...i,
      isFavorited: mockFavoriteIds.has(i.id),
    }))

    return {
      success: true,
      data: { list: pageList, total, page, pageSize },
    }
  }

  return request.get('/items', { params: query }) as Promise<
    ApiResponse<Paginated<Item>>
  >
}

/**
 * 商品详情
 * @param id 商品 ID
 */
export async function fetchItemDetail(id: string): Promise<ApiResponse<Item>> {
  if (USE_MOCK) {
    await delay()
    const item = mockItems.find((i) => i.id === id)
    if (!item) {
      return { success: false, data: null as unknown as Item, message: '商品不存在' }
    }
    return {
      success: true,
      data: { ...item, isFavorited: mockFavoriteIds.has(item.id) },
    }
  }
  return request.get(`/items/${id}`) as Promise<ApiResponse<Item>>
}

/**
 * 发布商品
 */
export async function createItem(
  payload: ItemFormPayload,
): Promise<ApiResponse<Item>> {
  if (USE_MOCK) {
    await delay()
    if (!payload.title?.trim() || !(payload.price > 0)) {
      return {
        success: false,
        data: null as unknown as Item,
        message: '标题必填且价格须大于 0',
      }
    }
    const userStore = useUserStore()
    const now = new Date().toISOString()
    const categoryName =
      MOCK_CATEGORIES.find((c) => c.id === payload.categoryId)?.name ?? '其他'
    const item: Item = {
      id: mockId('item'),
      sellerId: userStore.userInfo?.id || MOCK_USER.id,
      title: payload.title.trim(),
      description: payload.description?.trim() || '',
      price: Number(payload.price),
      categoryId: payload.categoryId,
      status: 'on_sale',
      imageUrl: payload.imageUrl?.trim() || 'https://picsum.photos/seed/new/640/480',
      createdAt: now,
      updatedAt: now,
      sellerUsername: userStore.userInfo?.username || MOCK_USER.username,
      categoryName,
      isFavorited: false,
    }
    mockItems.unshift(item)
    return { success: true, data: item, message: '发布成功' }
  }
  return request.post('/items', payload) as Promise<ApiResponse<Item>>
}

/**
 * 更新商品（基本信息或状态）
 */
export async function updateItem(
  id: string,
  payload: Partial<ItemFormPayload>,
): Promise<ApiResponse<Item>> {
  if (USE_MOCK) {
    await delay()
    const idx = mockItems.findIndex((i) => i.id === id)
    if (idx < 0) {
      return { success: false, data: null as unknown as Item, message: '商品不存在' }
    }
    const prev = mockItems[idx]
    if (prev.sellerId !== currentUserId()) {
      return { success: false, data: null as unknown as Item, message: '无权修改该商品' }
    }
    const categoryId = payload.categoryId ?? prev.categoryId
    const categoryName =
      MOCK_CATEGORIES.find((c) => c.id === categoryId)?.name ?? prev.categoryName
    const next: Item = {
      ...prev,
      title: payload.title?.trim() ?? prev.title,
      description:
        payload.description !== undefined
          ? payload.description.trim()
          : prev.description,
      price: payload.price !== undefined ? Number(payload.price) : prev.price,
      categoryId,
      categoryName,
      imageUrl: payload.imageUrl?.trim() || prev.imageUrl,
      status: (payload.status as ItemStatus) || prev.status,
      updatedAt: new Date().toISOString(),
    }
    mockItems[idx] = next
    return { success: true, data: { ...next }, message: '更新成功' }
  }
  return request.patch(`/items/${id}`, payload) as Promise<ApiResponse<Item>>
}
