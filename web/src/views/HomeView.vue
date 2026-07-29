<script setup lang="ts">
import { useAppStore } from '../stores'

const appStore = useAppStore()
</script>

<template>
  <div class="home">
    <h1>{{ appStore.appName }}</h1>
    <p>Vue3 + Vite 脚手架已就绪，业务功能待开发。</p>
    <el-button type="primary">Element Plus 已集成</el-button>
  </div>
</template>

<style scoped>
.home {
  max-width: 640px;
  margin: 4rem auto;
  text-align: center;
}

.home h1 {
  margin-bottom: 0.75rem;
  font-size: 1.75rem;
}

.home p {
  margin-bottom: 1.5rem;
  color: #606266;
}
</style>
