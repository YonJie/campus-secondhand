/** 商品状态 */
export type ItemStatus = 'on_sale' | 'reserved' | 'sold' | 'removed'

/** 统一 API 响应 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
}

/** 分页元信息（与契约 pagination 一致） */
export interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

/** 分页列表结果 */
export interface Paginated<T> {
  list: T[]
  pagination: Pagination
}

/** 用户信息 */
export interface UserInfo {
  id: string
  username: string
  avatarUrl?: string | null
  createdAt?: string
}

/** 登录/注册返回 */
export interface AuthResult {
  token: string
  user: UserInfo
}

/** 分类 */
export interface Category {
  id: string
  name: string
}

/** 商品 */
export interface Item {
  id: string
  sellerId: string
  title: string
  description: string | null
  price: number
  categoryId: string | null
  status: ItemStatus
  imageUrl: string | null
  createdAt: string
  updatedAt: string
  sellerUsername?: string
  categoryName?: string | null
  isFavorited?: boolean
}

/** 留言 */
export interface Message {
  id: string
  itemId: string
  senderId: string
  senderUsername?: string
  content: string
  isSelected: boolean
  createdAt: string
}

/** 商品列表查询参数 */
export interface ItemListQuery {
  keyword?: string
  categoryId?: string
  status?: string
  page?: number
  pageSize?: number
  /** 仅当前用户发布的商品（需鉴权） */
  mine?: boolean
}

/** 创建/更新商品表单 */
export interface ItemFormPayload {
  title?: string
  description?: string | null
  price?: number
  categoryId?: string | null
  imageUrl?: string | null
  status?: ItemStatus
}
