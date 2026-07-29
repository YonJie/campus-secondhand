<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { applyAuthResult, login } from '../api/auth'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const form = reactive({
  username: '',
  password: '',
})

/**
 * 提交登录
 */
async function onSubmit() {
  if (!form.username.trim() || !form.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }
  loading.value = true
  try {
    const res = await login(form.username.trim(), form.password)
    if (res.success) {
      applyAuthResult(res.data)
      ElMessage.success(res.message || '登录成功')
      const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
      router.replace(redirect || '/')
    }
  } catch {
    /* 401/错误由拦截器提示 */
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-panel panel">
      <p class="eyebrow">Account / Sign in</p>
      <h1 class="page-title">登录校园集市</h1>
      <p class="auth-desc">登录后可发布闲置、留言沟通与收藏心仪好物。</p>

      <el-form label-position="top" @submit.prevent="onSubmit">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="form.password"
            type="password"
            show-password
            placeholder="请输入密码"
            @keyup.enter="onSubmit"
          />
        </el-form-item>
        <button type="button" class="btn btn-accent btn-block" :disabled="loading" @click="onSubmit">
          {{ loading ? '登录中…' : '登录' }}
        </button>
      </el-form>

      <p class="auth-switch">
        还没有账号？
        <router-link to="/register">去注册</router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: calc(100vh - 56px);
  display: grid;
  place-items: center;
  padding: 24px;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(255, 194, 41, 0.18), transparent 50%),
    radial-gradient(ellipse at 90% 80%, rgba(47, 184, 139, 0.12), transparent 45%),
    var(--paper);
}

.auth-panel {
  width: min(420px, 100%);
}

.auth-desc {
  margin: 0 0 22px;
  color: var(--ink-soft);
  font-size: 14px;
  line-height: 1.5;
}

.auth-switch {
  margin: 18px 0 0;
  font-size: 14px;
  color: var(--ink-soft);
}

.auth-switch a {
  color: var(--ink);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
}
</style>
