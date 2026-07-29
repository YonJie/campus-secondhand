<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { fetchItems, updateItem } from '../api/items'
import StatusTag from '../components/StatusTag.vue'
import type { Item, ItemStatus } from '../types'

const router = useRouter()
const loading = ref(false)
const items = ref<Item[]>([])

const statusOptions: { label: string; value: ItemStatus }[] = [
  { label: '在售中', value: 'on_sale' },
  { label: '已预订', value: 'reserved' },
  { label: '已售出', value: 'sold' },
  { label: '已下架', value: 'removed' },
]

/**
 * 加载我的发布
 */
async function load() {
  loading.value = true
  try {
    const res = await fetchItems({ mine: true, page: 1, pageSize: 50 })
    if (res.success) items.value = res.data.list
  } finally {
    loading.value = false
  }
}

/**
 * 修改商品状态
 */
async function onStatusChange(item: Item, status: ItemStatus) {
  const res = await updateItem(item.id, { status })
  if (!res.success) {
    ElMessage.error(res.message || '更新失败')
    await load()
    return
  }
  item.status = res.data.status
  ElMessage.success(res.message || '状态已更新')
}

/**
 * el-select change 事件包装
 */
function handleStatusSelect(item: Item, value: string | number | boolean) {
  onStatusChange(item, value as ItemStatus)
}

onMounted(load)
</script>

<template>
  <div class="my-items">
    <header class="my-items__head">
      <div>
        <p class="eyebrow">Mine / 我的发布</p>
        <h1 class="page-title">我发布的闲置</h1>
      </div>
      <button type="button" class="btn btn-accent" @click="router.push('/items/new')">
        发布新商品
      </button>
    </header>

    <div v-loading="loading" class="list">
      <article v-for="item in items" :key="item.id" class="row panel">
        <img class="row__thumb" :src="item.imageUrl" :alt="item.title" />
        <div class="row__body">
          <div class="row__title-line">
            <h3>{{ item.title }}</h3>
            <StatusTag :status="item.status" />
          </div>
          <p class="row__price">¥{{ Number(item.price).toFixed(2) }}</p>
          <p class="row__meta">{{ item.categoryName }} · 更新于 {{ new Date(item.updatedAt).toLocaleString() }}</p>
        </div>
        <div class="row__actions">
          <el-select
            :model-value="item.status"
            size="small"
            style="width: 120px"
            @change="handleStatusSelect(item, $event)"
          >
            <el-option
              v-for="opt in statusOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <button type="button" class="btn btn-sm btn-ghost" @click="router.push(`/items/${item.id}`)">
            查看
          </button>
          <button type="button" class="btn btn-sm btn-primary" @click="router.push(`/items/${item.id}/edit`)">
            编辑
          </button>
        </div>
      </article>

      <el-empty v-if="!loading && items.length === 0" description="还没有发布过商品" />
    </div>
  </div>
</template>

<style scoped>
.my-items__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 20px;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.row {
  display: grid;
  grid-template-columns: 96px 1fr auto;
  gap: 16px;
  align-items: center;
  padding: 14px !important;
}

.row__thumb {
  width: 96px;
  height: 72px;
  object-fit: cover;
  border-radius: 8px;
  background: var(--paper);
}

.row__title-line {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 4px;
}

.row__title-line h3 {
  margin: 0;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--ink);
}

.row__price {
  margin: 0 0 4px;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 15px;
}

.row__meta {
  margin: 0;
  font-size: 12px;
  color: var(--ink-soft);
}

.row__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 860px) {
  .my-items__head {
    flex-direction: column;
    align-items: flex-start;
  }

  .row {
    grid-template-columns: 72px 1fr;
  }

  .row__actions {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }
}
</style>
