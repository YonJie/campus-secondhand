<script setup lang="ts">
import type { ItemStatus } from '../types'

const props = defineProps<{
  status: ItemStatus
}>()

const labelMap: Record<ItemStatus, string> = {
  on_sale: '在售中',
  reserved: '已预订',
  sold: '已售出',
  removed: '已下架',
}
</script>

<template>
  <span class="tag" :class="`tag--${props.status}`">{{ labelMap[props.status] }}</span>
</template>

<style scoped>
.tag {
  display: inline-block;
  position: relative;
  padding: 3px 10px 3px 14px;
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 10.5px;
  letter-spacing: 0.02em;
  color: #fff;
  clip-path: polygon(10px 0, 100% 0, 100% 100%, 10px 100%, 0 50%);
  line-height: 1.4;
}

.tag::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #fff;
}

.tag--on_sale {
  background: var(--mint);
}

.tag--reserved {
  background: var(--yellow);
  color: var(--ink);
}

.tag--reserved::after {
  background: var(--ink);
}

.tag--sold {
  background: var(--sold-gray);
}

.tag--removed {
  background: var(--line);
  color: var(--ink-soft);
}

.tag--removed::after {
  background: var(--ink-soft);
}
</style>
