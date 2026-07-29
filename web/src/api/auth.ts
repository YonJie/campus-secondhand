import request from '../utils/request'
import { USE_MOCK, delay } from '../utils/mock'
import { MOCK_USER, mockId } from '../mock/data'
import type { ApiResponse, AuthResult, UserInfo } from '../types'
import { useUserStore } from '../stores/user'

/**
 * 用户注册
 * @param username 用户名
 * @param password 密码
 */
export async function register(
  username: string,
  password: string,
): Promise<ApiResponse<AuthResult>> {
  if (USE_MOCK) {
    await delay()
    if (!username.trim() || !password) {
      return { success: false, data: null as unknown as AuthResult, message: '用户名和密码不能为空' }
    }
    const user: UserInfo = {
      id: mockId('u'),
      username: username.trim(),
      avatarUrl: null,
      createdAt: new Date().toISOString(),
    }
    return {
      success: true,
      data: { token: `mock-token-${user.id}`, user },
      message: '注册成功',
    }
  }
  return request.post('/auth/register', { username, password }) as Promise<ApiResponse<AuthResult>>
}

/**
 * 用户登录
 * @param username 用户名
 * @param password 密码
 */
export async function login(
  username: string,
  password: string,
): Promise<ApiResponse<AuthResult>> {
  if (USE_MOCK) {
    await delay()
    if (!username.trim() || !password) {
      return { success: false, data: null as unknown as AuthResult, message: '用户名和密码不能为空' }
    }
    // Mock：任意账号可登录；用户名匹配卖家则使用卖家身份便于演示「选为买家」
    const user: UserInfo =
      username.trim() === MOCK_USER.username
        ? { ...MOCK_USER }
        : {
            id: mockId('u'),
            username: username.trim(),
            avatarUrl: null,
            createdAt: new Date().toISOString(),
          }
    return {
      success: true,
      data: { token: `mock-token-${user.id}`, user },
      message: '登录成功',
    }
  }
  return request.post('/auth/login', { username, password }) as Promise<ApiResponse<AuthResult>>
}

/**
 * 将登录结果写入 userStore
 */
export function applyAuthResult(result: AuthResult) {
  const userStore = useUserStore()
  userStore.setAuth(result.token, result.user)
}
