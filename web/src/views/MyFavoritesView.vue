<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchFavorites, removeFavorite } from '../api/favorites'
import ItemCard from '../components/ItemCard.vue'
import type { Item } from '../types'

const loading = ref(false)
const items = ref<Item[]>([])

/**
 * 加载收藏列表
 */
async function load() {
  loading.value = true
  try {
    const res = await fetchFavorites()
    if (res.success) items.value = res.data
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}

/**
 * 取消收藏并刷新
 */
async function unfavorite(item: Item) {
  try {
    const res = await removeFavorite(item.id)
    if (res.success) {
      items.value = items.value.filter((i) => i.id !== item.id)
      ElMessage.success(res.message || '已取消收藏')
    }
  } catch {
    /* 拦截器已提示 */
  }
}

onMounted(load)
</script>

<template>
  <div class="favorites">
    <p class="eyebrow">Mine / 我的收藏</p>
    <h1 class="page-title">收藏夹</h1>
    <p class="favorites__lead">想要的闲置先钉在这里，别让它溜走。</p>

    <div v-loading="loading" class="fav-body">
      <div v-if="items.length" class="grid">
        <div v-for="(item, index) in items" :key="item.id" class="fav-wrap">
          <ItemCard :item="item" :index="index" />
          <button type="button" class="btn btn-sm btn-ghost fav-wrap__btn" @click="unfavorite(item)">
            取消收藏
          </button>
        </div>
      </div>
      <el-empty v-else-if="!loading" description="收藏夹还是空的" />
    </div>
  </div>
</template>

<style scoped>
.favorites__lead {
  margin: -4px 0 22px;
  color: var(--ink-soft);
  font-size: 14px;
}

.fav-body {
  min-height: 160px;
}

.fav-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fav-wrap__btn {
  align-self: center;
}
</style>
