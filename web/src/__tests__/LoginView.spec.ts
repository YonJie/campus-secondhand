import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

vi.mock('../api/auth', () => ({
  login: vi.fn(),
  applyAuthResult: vi.fn(),
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    warning: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
  useRoute: () => ({
    query: {},
  }),
}))

import LoginView from '../views/LoginView.vue'
import { login } from '../api/auth'

const ElFormStub = defineComponent({
  name: 'ElForm',
  setup(_, { slots }) {
    return () => h('form', slots.default?.())
  },
})

const ElFormItemStub = defineComponent({
  name: 'ElFormItem',
  props: { label: String },
  setup(props, { slots }) {
    return () =>
      h('div', { class: 'el-form-item' }, [h('label', props.label), slots.default?.()])
  },
})

const ElInputStub = defineComponent({
  name: 'ElInput',
  props: {
    modelValue: { type: String, default: '' },
    type: { type: String, default: 'text' },
    placeholder: String,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('input', {
        value: props.modelValue,
        type: props.type === 'password' ? 'password' : 'text',
        placeholder: props.placeholder,
        onInput: (e: Event) =>
          emit('update:modelValue', (e.target as HTMLInputElement).value),
      })
  },
})

describe('LoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('渲染登录标题、表单字段与注册引导', () => {
    const wrapper = mount(LoginView, {
      global: {
        stubs: {
          RouterLink: {
            props: ['to'],
            template: '<a :href="to"><slot /></a>',
          },
          'el-form': ElFormStub,
          'el-form-item': ElFormItemStub,
          'el-input': ElInputStub,
        },
      },
    })

    expect(wrapper.text()).toContain('登录校园集市')
    expect(wrapper.text()).toContain('登录')
    expect(wrapper.text()).toContain('去注册')
    expect(wrapper.find('a').attributes('href')).toBe('/register')

    const inputs = wrapper.findAll('input')
    expect(inputs.length).toBeGreaterThanOrEqual(2)
    expect(inputs[0].attributes('placeholder')).toBe('请输入用户名')
    expect(inputs[1].attributes('type')).toBe('password')
  })

  it('用户名或密码为空时不调用 login', async () => {
    const wrapper = mount(LoginView, {
      global: {
        stubs: {
          RouterLink: true,
          'el-form': ElFormStub,
          'el-form-item': ElFormItemStub,
          'el-input': ElInputStub,
        },
      },
    })

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(login).not.toHaveBeenCalled()
  })
})
