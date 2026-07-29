import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { UserInfo } from '../types'

const TOKEN_KEY = 'cs_token'
const USER_KEY = 'cs_user'

/**
 * 登录态 Store：token / userInfo，持久化到 localStorage
 */
export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem(TOKEN_KEY) || '')
  const userInfo = ref<UserInfo | null>(readUser())

  const isLoggedIn = computed(() => Boolean(token.value))

  /**
   * 从 localStorage 读取用户信息
   */
  function readUser(): UserInfo | null {
    try {
      const raw = localStorage.getItem(USER_KEY)
      return raw ? (JSON.parse(raw) as UserInfo) : null
    } catch {
      return null
    }
  }

  /**
   * 写入登录态
   * @param newToken JWT
   * @param user 用户信息
   */
  function setAuth(newToken: string, user: UserInfo) {
    token.value = newToken
    userInfo.value = user
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }

  /**
   * 清除登录态
   */
  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    setAuth,
    logout,
  }
})
