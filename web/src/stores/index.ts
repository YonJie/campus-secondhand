import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 应用全局状态（脚手架占位，后续按业务扩展）
 */
export const useAppStore = defineStore('app', () => {
  const appName = ref('校园二手交易平台')

  return {
    appName,
  }
})
