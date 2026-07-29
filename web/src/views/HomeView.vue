<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { fetchCategories } from '../api/categories'
import { fetchItems } from '../api/items'
import ItemCard from '../components/ItemCard.vue'
import type { Category, Item } from '../types'

const loading = ref(false)
const items = ref<Item[]>([])
const categories = ref<Category[]>([])
const total = ref(0)

const filters = reactive({
  keyword: '',
  categoryId: '',
  page: 1,
  pageSize: 10,
})

/**
 * 加载分类
 */
async function loadCategories() {
  try {
    const res = await fetchCategories()
    if (res.success) categories.value = res.data
  } catch {
    categories.value = []
  }
}

/**
 * 加载商品列表
 */
async function loadItems() {
  loading.value = true
  try {
    const res = await fetchItems({
      keyword: filters.keyword || undefined,
      categoryId: filters.categoryId || undefined,
      page: filters.page,
      pageSize: filters.pageSize,
    })
    if (res.success) {
      items.value = res.data.list
      total.value = res.data.pagination.total
    }
  } catch {
    items.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function onSearch() {
  filters.page = 1
  loadItems()
}

function onPageChange(page: number) {
  filters.page = page
  loadItems()
}

watch(
  () => filters.categoryId,
  () => {
    filters.page = 1
    loadItems()
  },
)

onMounted(async () => {
  await loadCategories()
  await loadItems()
})
</script>

<template>
  <div class="home">
    <header class="home__hero">
      <p class="eyebrow">Home / 商品列表</p>
      <h1 class="page-title">校园布告栏</h1>
      <p class="home__lead">把闲置钉上布告栏，让下一任主人来揭下它。</p>
    </header>

    <div class="toolbar panel">
      <el-input
        v-model="filters.keyword"
        clearable
        placeholder="搜索标题关键词"
        class="toolbar__search"
        @keyup.enter="onSearch"
        @clear="onSearch"
      />
      <el-select
        v-model="filters.categoryId"
        clearable
        placeholder="全部分类"
        class="toolbar__select"
      >
        <el-option
          v-for="c in categories"
          :key="c.id"
          :label="c.name"
          :value="c.id"
        />
      </el-select>
      <button type="button" class="btn btn-primary" @click="onSearch">搜索</button>
    </div>

    <div v-loading="loading" class="grid-wrap">
      <div v-if="items.length" class="grid">
        <ItemCard
          v-for="(item, index) in items"
          :key="item.id"
          :item="item"
          :index="index"
        />
      </div>
      <el-empty v-else-if="!loading" description="暂无商品" />
    </div>

    <div v-if="total > filters.pageSize" class="pager">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="filters.pageSize"
        :current-page="filters.page"
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.home__hero {
  margin-bottom: 22px;
}

.home__lead {
  margin: 0;
  color: var(--ink-soft);
  font-size: 15px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px 18px;
}

.toolbar__search {
  flex: 1;
  min-width: 180px;
}

.toolbar__select {
  width: 160px;
}

.grid-wrap {
  min-height: 160px;
}

.pager {
  display: flex;
  justify-content: center;
  margin-top: 28px;
}
</style>
