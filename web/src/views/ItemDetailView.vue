<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { fetchItemDetail } from '../api/items'
import { fetchMessages, postMessage, selectBuyer } from '../api/messages'
import { addFavorite, fetchFavorites, removeFavorite } from '../api/favorites'
import { submitReport } from '../api/reports'
import StatusTag from '../components/StatusTag.vue'
import ReportDialog from '../components/ReportDialog.vue'
import { useUserStore } from '../stores'
import type { Item, Message } from '../types'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const item = ref<Item | null>(null)
const messages = ref<Message[]>([])
const messagesHint = ref('')
const content = ref('')
const reportOpen = ref(false)
const submitting = ref(false)

const itemId = computed(() => String(route.params.id))
const isSeller = computed(
  () => Boolean(item.value && userStore.userInfo?.id === item.value.sellerId),
)

/**
 * 加载详情、收藏态与留言
 */
async function load() {
  loading.value = true
  messagesHint.value = ''
  try {
    const itemRes = await fetchItemDetail(itemId.value)
    if (!itemRes.success) {
      item.value = null
      return
    }
    item.value = { ...itemRes.data, isFavorited: false }

    if (userStore.isLoggedIn) {
      await Promise.all([loadFavoriteState(), loadMessages()])
    } else {
      messages.value = []
      messagesHint.value = '登录后可查看与发表留言'
    }
  } catch {
    item.value = null
    messages.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 用收藏列表判断当前商品是否已收藏
 */
async function loadFavoriteState() {
  if (!item.value) return
  try {
    const res = await fetchFavorites()
    if (res.success) {
      item.value.isFavorited = res.data.some((i) => i.id === item.value!.id)
    }
  } catch {
    /* 收藏态失败不阻塞详情 */
  }
}

/**
 * 加载留言（需鉴权；403 时给出提示）
 */
async function loadMessages() {
  try {
    const msgRes = await fetchMessages(itemId.value)
    if (msgRes.success) {
      messages.value = msgRes.data
      messagesHint.value = ''
    }
  } catch (err: unknown) {
    messages.value = []
    const status =
      err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { status?: number } }).response?.status
        : undefined
    if (status === 403) {
      messagesHint.value = '发表留言后即可查看全部留言'
    } else if (status !== 401) {
      messagesHint.value = '留言加载失败'
    }
  }
}

function ensureLogin(): boolean {
  if (!userStore.isLoggedIn) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return false
  }
  return true
}

/**
 * 切换收藏
 */
async function toggleFavorite() {
  if (!item.value || !ensureLogin()) return
  const favorited = Boolean(item.value.isFavorited)
  try {
    const res = favorited
      ? await removeFavorite(item.value.id)
      : await addFavorite(item.value.id)
    if (res.success) {
      item.value.isFavorited = !favorited
      ElMessage.success(res.message || (favorited ? '已取消收藏' : '已收藏'))
    }
  } catch {
    /* 错误由 request 拦截器提示 */
  }
}

/**
 * 发表留言
 */
async function sendMessage() {
  if (!ensureLogin()) return
  if (!content.value.trim()) {
    ElMessage.warning('请输入留言内容')
    return
  }
  submitting.value = true
  try {
    const res = await postMessage(itemId.value, content.value)
    if (res.success) {
      content.value = ''
      ElMessage.success(res.message || '留言成功')
      await loadMessages()
    }
  } catch {
    /* 拦截器已提示 */
  } finally {
    submitting.value = false
  }
}

/**
 * 选为买家
 */
async function onSelectBuyer(messageId: string) {
  try {
    const res = await selectBuyer(messageId)
    if (res.success) {
      item.value = res.data.item
      messages.value = messages.value.map((m) =>
        m.itemId === res.data.item.id
          ? { ...m, isSelected: m.id === messageId }
          : m,
      )
      ElMessage.success(res.message || '已选为买家')
    }
  } catch {
    /* 拦截器已提示 */
  }
}

/**
 * 提交举报
 */
async function onReport(reason: string) {
  if (!ensureLogin()) return
  if (!reason.trim()) {
    ElMessage.warning('请填写举报理由')
    return
  }
  try {
    const res = await submitReport(itemId.value, reason)
    if (res.success) {
      reportOpen.value = false
      ElMessage.success(res.message || '举报已提交')
    }
  } catch {
    /* 拦截器已提示 */
  }
}

watch(itemId, load)
onMounted(load)
</script>

<template>
  <div v-loading="loading" class="detail">
    <template v-if="item">
      <p class="eyebrow">Item / {{ item.categoryName || '详情' }}</p>
      <div class="detail-layout">
        <div class="detail-media">
          <img
            v-if="item.imageUrl"
            :src="item.imageUrl"
            :alt="item.title"
            referrerpolicy="no-referrer"
          />
          <div v-else class="detail-media__placeholder">暂无图片</div>
        </div>

        <div class="detail-info panel">
          <div class="detail-info__top">
            <StatusTag :status="item.status" />
            <span class="detail-seller">卖家 · {{ item.sellerUsername }}</span>
          </div>
          <h1 class="page-title detail-title">{{ item.title }}</h1>
          <p class="detail-price">¥{{ Number(item.price).toFixed(2) }}</p>
          <p class="detail-desc">{{ item.description || '暂无描述' }}</p>

          <div class="detail-actions">
            <button
              type="button"
              class="icon-btn fav"
              :class="{ 'is-active': item.isFavorited }"
              @click="toggleFavorite"
            >
              {{ item.isFavorited ? '已收藏' : '收藏' }}
            </button>
            <button type="button" class="btn btn-ghost" @click="reportOpen = true">
              举报
            </button>
            <router-link
              v-if="isSeller"
              class="btn btn-primary"
              :to="`/items/${item.id}/edit`"
            >
              编辑
            </router-link>
          </div>
        </div>
      </div>

      <section class="messages panel">
        <h2 class="section-title">留言区</h2>

        <ul v-if="messages.length" class="msg-list">
          <li v-for="msg in messages" :key="msg.id" class="msg-item">
            <div class="msg-item__head">
              <strong>{{ msg.senderUsername || '用户' }}</strong>
              <time>{{ new Date(msg.createdAt).toLocaleString() }}</time>
              <span v-if="msg.isSelected" class="msg-selected">已选买家</span>
            </div>
            <p class="msg-item__body">{{ msg.content }}</p>
            <button
              v-if="isSeller && !msg.isSelected && item.status === 'on_sale'"
              type="button"
              class="btn btn-sm btn-accent"
              @click="onSelectBuyer(msg.id)"
            >
              选为买家
            </button>
          </li>
        </ul>
        <el-empty
          v-else
          :description="messagesHint || '还没有留言，来打个招呼吧'"
          :image-size="72"
        />

        <div class="msg-compose">
          <el-input
            v-model="content"
            type="textarea"
            :rows="3"
            maxlength="300"
            show-word-limit
            placeholder="写下你的留言…"
          />
          <button
            type="button"
            class="btn btn-primary"
            :disabled="submitting"
            @click="sendMessage"
          >
            发表留言
          </button>
        </div>
      </section>

      <ReportDialog v-model="reportOpen" @submit="onReport" />
    </template>

    <el-empty v-else-if="!loading" description="商品不存在或已删除" />
  </div>
</template>

<style scoped>
.detail-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

.detail-media {
  border-radius: 14px;
  overflow: hidden;
  background: var(--paper-raised);
  box-shadow: var(--shadow);
  border: 1px solid var(--line);
  min-height: 280px;
}

.detail-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  min-height: 320px;
}

.detail-media__placeholder {
  min-height: 320px;
  display: grid;
  place-items: center;
  color: var(--ink-soft);
  background: var(--paper);
}

.detail-info__top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.detail-seller {
  font-size: 13px;
  color: var(--ink-soft);
}

.detail-title {
  margin-bottom: 8px;
}

.detail-price {
  margin: 0 0 14px;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 28px;
  color: var(--ink);
}

.detail-desc {
  margin: 0 0 20px;
  color: var(--ink-soft);
  line-height: 1.65;
  white-space: pre-wrap;
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.section-title {
  margin: 0 0 16px;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--ink);
}

.msg-list {
  list-style: none;
  margin: 0 0 20px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.msg-item {
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--paper);
}

.msg-item__head {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: baseline;
  margin-bottom: 8px;
  font-size: 13px;
}

.msg-item__head strong {
  color: var(--ink);
}

.msg-item__head time {
  color: var(--ink-soft);
  font-family: var(--font-mono);
  font-size: 11px;
}

.msg-selected {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ink);
  background: var(--yellow);
  padding: 2px 8px;
  border-radius: 999px;
}

.msg-item__body {
  margin: 0 0 10px;
  color: var(--ink);
  line-height: 1.5;
}

.msg-compose {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
}

.msg-compose :deep(.el-textarea) {
  width: 100%;
}

@media (max-width: 860px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
}
</style>
