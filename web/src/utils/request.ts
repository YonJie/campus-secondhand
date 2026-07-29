import axios from 'axios'

/**
 * Axios 实例：统一请求基址与超时
 * 本地开发时可通过 Vite 代理转发到 /api
 */
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
})

request.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
)

request.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error),
)

export default request
