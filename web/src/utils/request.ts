import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResponse } from '../types'

const TOKEN_KEY = 'cs_token'

/**
 * 读取本地持久化的 JWT
 */
export function getStoredToken(): string {
  return localStorage.getItem(TOKEN_KEY) || ''
}

/**
 * Axios 实例：统一请求基址、鉴权头与错误提示
 * 本地开发时可通过 Vite 代理转发到 /api
 */
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
})

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

request.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse
    if (body && typeof body.success === 'boolean' && !body.success) {
      ElMessage.error(body.message || '请求失败')
      return Promise.reject(body)
    }
    // 业务层直接拿到 { success, data, message }
    return body as unknown as typeof response
  },
  (error: AxiosError<ApiResponse>) => {
    const msg =
      error.response?.data?.message ||
      error.message ||
      '网络异常，请稍后重试'
    if (error.response?.status !== 401) {
      ElMessage.error(msg)
    }
    return Promise.reject(error)
  },
)

export default request
