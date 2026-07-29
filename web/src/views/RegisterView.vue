<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { applyAuthResult, register } from '../api/auth'

const router = useRouter()
const loading = ref(false)
const form = reactive({
  username: '',
  password: '',
  confirm: '',
})

/**
 * 提交注册
 */
async function onSubmit() {
  if (!form.username.trim()) {
    ElMessage.warning('请输入用户名')
    return
  }
  if (form.password.length < 6) {
    ElMessage.warning('密码至少 6 位')
    return
  }
  if (form.password !== form.confirm) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }
  loading.value = true
  try {
    const res = await register(form.username.trim(), form.password)
    if (res.success) {
      applyAuthResult(res.data)
      ElMessage.success(res.message || '注册成功')
      router.replace('/')
    }
  } catch {
    /* 拦截器已提示 */
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-panel panel">
      <p class="eyebrow">Account / Sign up</p>
      <h1 class="page-title">注册新账号</h1>
      <p class="auth-desc">创建账号后即可发布闲置、留言沟通与收藏心仪好物。</p>

      <el-form label-position="top" @submit.prevent="onSubmit">
        <el-form-item label="用户名">
          <el-input v-model="form.username" placeholder="设置用户名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password placeholder="至少 6 位" />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input
            v-model="form.confirm"
            type="password"
            show-password
            placeholder="再次输入密码"
            @keyup.enter="onSubmit"
          />
        </el-form-item>
        <button type="button" class="btn btn-accent btn-block" :disabled="loading" @click="onSubmit">
          {{ loading ? '提交中…' : '注册' }}
        </button>
      </el-form>

      <p class="auth-switch">
        已有账号？
        <router-link to="/login">去登录</router-link>
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
    radial-gradient(ellipse at 80% 10%, rgba(255, 194, 41, 0.16), transparent 48%),
    radial-gradient(ellipse at 10% 90%, rgba(255, 100, 82, 0.08), transparent 40%),
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
