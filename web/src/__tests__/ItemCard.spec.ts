import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ItemCard from '../components/ItemCard.vue'
import type { Item } from '../types'

/**
 * 构造测试用商品
 * @param overrides 覆盖字段
 */
function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    sellerId: '11111111-2222-3333-4444-555555555555',
    title: '二手高等数学教材',
    description: '几乎全新',
    price: 25.5,
    categoryId: null,
    status: 'on_sale',
    imageUrl: 'https://example.com/book.jpg',
    createdAt: '2026-07-29T02:00:00.000Z',
    updatedAt: '2026-07-29T02:00:00.000Z',
    sellerUsername: 'alice',
    ...overrides,
  }
}

describe('ItemCard', () => {
  it('渲染标题、价格、状态与详情链接', () => {
    const item = makeItem()
    const wrapper = mount(ItemCard, {
      props: { item, index: 0 },
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="typeof to === \'string\' ? to : \'\'"><slot /></a>',
          },
        },
      },
    })

    expect(wrapper.text()).toContain('二手高等数学教材')
    expect(wrapper.text()).toContain('¥25.50')
    expect(wrapper.text()).toContain('在售中')
    expect(wrapper.find('a').attributes('href')).toBe(`/items/${item.id}`)
    expect(wrapper.find('img').attributes('src')).toBe(item.imageUrl!)
  })

  it('无图片时显示占位文案', () => {
    const wrapper = mount(ItemCard, {
      props: { item: makeItem({ imageUrl: null }) },
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="typeof to === \'string\' ? to : \'\'"><slot /></a>',
          },
        },
      },
    })

    expect(wrapper.text()).toContain('暂无图片')
    expect(wrapper.find('img').exists()).toBe(false)
  })
})
