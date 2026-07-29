import type { Category, Item, Message, UserInfo } from '../types'

/** Mock 当前用户（登录后默认用此账号） */
export const MOCK_USER: UserInfo = {
  id: 'u-seller-001',
  username: 'campus_seller',
  avatarUrl: null,
  createdAt: '2026-07-01T08:00:00.000Z',
}

/** 另一位买家用户（留言演示） */
export const MOCK_BUYER: UserInfo = {
  id: 'u-buyer-002',
  username: 'bookworm',
  avatarUrl: null,
  createdAt: '2026-07-02T08:00:00.000Z',
}

/** 分类种子 */
export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat-1', name: '教材' },
  { id: 'cat-2', name: '数码' },
  { id: 'cat-3', name: '生活用品' },
  { id: 'cat-4', name: '服饰' },
  { id: 'cat-5', name: '其他' },
]

const categoryName = (id: string) =>
  MOCK_CATEGORIES.find((c) => c.id === id)?.name ?? '其他'

/**
 * Mock 商品列表（可变，供发布/编辑/状态变更）
 */
export const mockItems: Item[] = [
  {
    id: 'item-1',
    sellerId: MOCK_USER.id,
    title: '高等数学同济第七版上下册',
    description: '九成新，无笔记，封面轻微磨损。可面交东区图书馆。',
    price: 35,
    categoryId: 'cat-1',
    status: 'on_sale',
    imageUrl: 'https://picsum.photos/seed/math/640/480',
    createdAt: '2026-07-20T10:00:00.000Z',
    updatedAt: '2026-07-20T10:00:00.000Z',
    sellerUsername: MOCK_USER.username,
    categoryName: categoryName('cat-1'),
  },
  {
    id: 'item-2',
    sellerId: MOCK_BUYER.id,
    title: '索尼 WH-1000XM4 降噪耳机',
    description: '使用一年，功能完好，配件齐全。支持蓝牙试听。',
    price: 880,
    categoryId: 'cat-2',
    status: 'reserved',
    imageUrl: 'https://picsum.photos/seed/headphone/640/480',
    createdAt: '2026-07-18T14:30:00.000Z',
    updatedAt: '2026-07-25T09:00:00.000Z',
    sellerUsername: MOCK_BUYER.username,
    categoryName: categoryName('cat-2'),
  },
  {
    id: 'item-3',
    sellerId: MOCK_USER.id,
    title: '宜家台灯（暖光）',
    description: '宿舍用过一学期，灯罩完好，底座有轻微划痕。',
    price: 45,
    categoryId: 'cat-3',
    status: 'on_sale',
    imageUrl: 'https://picsum.photos/seed/lamp/640/480',
    createdAt: '2026-07-22T16:00:00.000Z',
    updatedAt: '2026-07-22T16:00:00.000Z',
    sellerUsername: MOCK_USER.username,
    categoryName: categoryName('cat-3'),
  },
  {
    id: 'item-4',
    sellerId: MOCK_BUYER.id,
    title: '优衣库薄款羽绒服 M',
    description: '去年冬天买的，尺码偏大，几乎全新。',
    price: 120,
    categoryId: 'cat-4',
    status: 'sold',
    imageUrl: 'https://picsum.photos/seed/coat/640/480',
    createdAt: '2026-07-10T11:00:00.000Z',
    updatedAt: '2026-07-15T11:00:00.000Z',
    sellerUsername: MOCK_BUYER.username,
    categoryName: categoryName('cat-4'),
  },
  {
    id: 'item-5',
    sellerId: MOCK_USER.id,
    title: '机械键盘红轴（有线）',
    description: '键帽有使用痕迹，轴体手感正常，附键帽拔键器。',
    price: 160,
    categoryId: 'cat-2',
    status: 'on_sale',
    imageUrl: 'https://picsum.photos/seed/keyboard/640/480',
    createdAt: '2026-07-24T08:20:00.000Z',
    updatedAt: '2026-07-24T08:20:00.000Z',
    sellerUsername: MOCK_USER.username,
    categoryName: categoryName('cat-2'),
  },
  {
    id: 'item-6',
    sellerId: MOCK_BUYER.id,
    title: '自行车锁 + 头盔',
    description: '毕业清仓，一起带走更划算。',
    price: 55,
    categoryId: 'cat-5',
    status: 'on_sale',
    imageUrl: 'https://picsum.photos/seed/bike/640/480',
    createdAt: '2026-07-21T19:00:00.000Z',
    updatedAt: '2026-07-21T19:00:00.000Z',
    sellerUsername: MOCK_BUYER.username,
    categoryName: categoryName('cat-5'),
  },
  {
    id: 'item-7',
    sellerId: MOCK_USER.id,
    title: '线性代数教材（华科版）',
    description: '有少量铅笔笔记，可擦除。',
    price: 18,
    categoryId: 'cat-1',
    status: 'removed',
    imageUrl: 'https://picsum.photos/seed/linear/640/480',
    createdAt: '2026-07-05T09:00:00.000Z',
    updatedAt: '2026-07-12T09:00:00.000Z',
    sellerUsername: MOCK_USER.username,
    categoryName: categoryName('cat-1'),
  },
  {
    id: 'item-8',
    sellerId: MOCK_BUYER.id,
    title: '小米充电宝 20000mAh',
    description: '原装线齐全，电池健康。',
    price: 70,
    categoryId: 'cat-2',
    status: 'on_sale',
    imageUrl: 'https://picsum.photos/seed/powerbank/640/480',
    createdAt: '2026-07-26T12:00:00.000Z',
    updatedAt: '2026-07-26T12:00:00.000Z',
    sellerUsername: MOCK_BUYER.username,
    categoryName: categoryName('cat-2'),
  },
]

/** Mock 留言（按商品） */
export const mockMessages: Message[] = [
  {
    id: 'msg-1',
    itemId: 'item-1',
    senderId: MOCK_BUYER.id,
    senderUsername: MOCK_BUYER.username,
    content: '明天下午东区方便面交吗？',
    isSelected: false,
    createdAt: '2026-07-21T10:00:00.000Z',
  },
  {
    id: 'msg-2',
    itemId: 'item-1',
    senderId: 'u-buyer-003',
    senderUsername: 'freshman88',
    content: '还能便宜一点吗？30 出吗？',
    isSelected: false,
    createdAt: '2026-07-21T15:30:00.000Z',
  },
  {
    id: 'msg-3',
    itemId: 'item-2',
    senderId: MOCK_USER.id,
    senderUsername: MOCK_USER.username,
    content: '耳机还在吗？想预定。',
    isSelected: true,
    createdAt: '2026-07-25T08:00:00.000Z',
  },
]

/** 当前用户收藏的商品 ID 集合 */
export const mockFavoriteIds = new Set<string>(['item-2', 'item-8'])

/**
 * 生成简易 UUID（仅用于 mock）
 * @returns {string}
 */
export function mockId(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}
