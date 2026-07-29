<script setup lang="ts">
import type { Item } from '../types'
import StatusTag from './StatusTag.vue'

defineProps<{
  item: Item
  /** 网格中的序号，用于奇偶贴纸旋转 */
  index?: number
}>()
</script>

<template>
  <router-link
    class="item-card"
    :class="{ 'item-card--odd': (index ?? 0) % 2 === 0, 'item-card--even': (index ?? 0) % 2 === 1 }"
    :to="`/items/${item.id}`"
  >
    <div class="item-card__media">
      <img
        v-if="item.imageUrl"
        :src="item.imageUrl"
        :alt="item.title"
        loading="lazy"
      />
      <div v-else class="item-card__placeholder">暂无图片</div>
    </div>
    <div class="item-card__body">
      <div class="item-card__meta">
        <StatusTag :status="item.status" />
      </div>
      <h3 class="item-card__title">{{ item.title }}</h3>
      <p class="item-card__price">¥{{ Number(item.price).toFixed(2) }}</p>
    </div>
  </router-link>
</template>

<style scoped>
.item-card {
  display: block;
  background: var(--paper-raised);
  border-radius: 12px;
  padding: 12px;
  box-shadow: var(--shadow);
  color: inherit;
  text-decoration: none;
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: 1px solid var(--line);
}

.item-card::before {
  content: '';
  position: absolute;
  top: 8px;
  left: 10px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--pin);
  box-shadow: 0 1px 2px rgba(30, 42, 56, 0.35);
  z-index: 2;
}

.item-card--odd {
  transform: rotate(-0.6deg);
}

.item-card--even {
  transform: rotate(0.6deg);
}

.item-card:hover {
  transform: rotate(0deg) translateY(-3px);
  box-shadow: 0 2px 0 rgba(30, 42, 56, 0.04), 0 14px 28px -12px rgba(30, 42, 56, 0.28);
}

.item-card__media {
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 4 / 3;
  background: var(--paper);
}

.item-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.item-card__placeholder {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--ink-soft);
  font-size: 13px;
}

.item-card__body {
  padding-top: 10px;
}

.item-card__meta {
  margin-bottom: 6px;
}

.item-card__title {
  margin: 0 0 8px;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 15px;
  line-height: 1.35;
  color: var(--ink);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.item-card__price {
  margin: 0;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 16px;
  color: var(--ink);
}
</style>
