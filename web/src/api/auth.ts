import request from '../utils/request'
import type { ApiResponse, AuthResult } from '../types'
import { useUserStore } from '../stores/user'

/**
 * 用户注册
 * @param username 用户名
 * @param password 密码
 */
export function register(
  username: string,
  password: string,
): Promise<ApiResponse<AuthResult>> {
  return request.post('/auth/register', { username, password }) as Promise<
    ApiResponse<AuthResult>
  >
}

/**
 * 用户登录
 * @param username 用户名
 * @param password 密码
 */
export function login(
  username: string,
  password: string,
): Promise<ApiResponse<AuthResult>> {
  return request.post('/auth/login', { username, password }) as Promise<
    ApiResponse<AuthResult>
  >
}

/**
 * 将登录结果写入 userStore
 * @param result 鉴权结果
 */
export function applyAuthResult(result: AuthResult) {
  const userStore = useUserStore()
  userStore.setAuth(result.token, result.user)
}
