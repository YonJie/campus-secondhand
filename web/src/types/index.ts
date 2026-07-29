/** 商品状态 */
export type ItemStatus = 'on_sale' | 'reserved' | 'sold' | 'removed'

/** 统一 API 响应 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data: T
  message?: string
}

/** 分页结果 */
export interface Paginated<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
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
  description: string
  price: number
  categoryId: string
  status: ItemStatus
  imageUrl: string
  createdAt: string
  updatedAt: string
  sellerUsername?: string
  categoryName?: string
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
  /** 仅当前用户发布的商品 */
  mine?: boolean
}

/** 创建/更新商品表单 */
export interface ItemFormPayload {
  title: string
  description?: string
  price: number
  categoryId: string
  imageUrl?: string
  status?: ItemStatus
}
