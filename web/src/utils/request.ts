import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResponse } from '../types'

const TOKEN_KEY = 'cs_token'

/** 防止 401 重复跳转 */
let handling401 = false

/** 扩展请求配置：静默错误（由业务自行处理提示） */
export interface AppRequestConfig extends AxiosRequestConfig {
  silentError?: boolean
}

/**
 * 读取本地持久化的 JWT
 */
export function getStoredToken(): string {
  return localStorage.getItem(TOKEN_KEY) || ''
}

/**
 * Axios 实例：统一请求基址、鉴权头与错误提示
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
      const silent = Boolean(
        (response.config as AppRequestConfig | undefined)?.silentError,
      )
      if (!silent) {
        ElMessage.error(body.message || '请求失败')
      }
      return Promise.reject(body)
    }
    return body as unknown as typeof response
  },
  async (error: AxiosError<ApiResponse>) => {
    const status = error.response?.status
    const msg =
      error.response?.data?.message ||
      error.message ||
      '网络异常，请稍后重试'
    const silent = Boolean((error.config as AppRequestConfig | undefined)?.silentError)

    const url = error.config?.url || ''
    const isAuthEndpoint =
      url.includes('/auth/login') || url.includes('/auth/register')

    if (status === 401 && !isAuthEndpoint) {
      await handleUnauthorized(msg)
      return Promise.reject(error)
    }

    if (!silent) {
      ElMessage.error(msg)
    }
    return Promise.reject(error)
  },
)

/**
 * 登录失效：清空本地态并跳转登录页
 * @param message 提示文案
 */
async function handleUnauthorized(message: string) {
  if (handling401) return
  handling401 = true
  try {
    const { useUserStore } = await import('../stores/user')
    const { default: router } = await import('../router')
    const userStore = useUserStore()
    userStore.logout()
    ElMessage.error(message || '登录已失效，请重新登录')
    const redirect = router.currentRoute.value.fullPath
    if (router.currentRoute.value.name !== 'login') {
      await router.push({
        name: 'login',
        query: redirect && redirect !== '/login' ? { redirect } : undefined,
      })
    }
  } finally {
    setTimeout(() => {
      handling401 = false
    }, 800)
  }
}

export default request
