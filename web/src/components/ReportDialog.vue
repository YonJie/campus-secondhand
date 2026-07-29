<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [reason: string]
}>()

const reason = ref('')

watch(
  () => props.modelValue,
  (open) => {
    if (open) reason.value = ''
  },
)

function close() {
  emit('update:modelValue', false)
}

function onConfirm() {
  emit('submit', reason.value)
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="举报商品"
    width="420px"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-input
      v-model="reason"
      type="textarea"
      :rows="4"
      maxlength="200"
      show-word-limit
      placeholder="请简要说明举报理由"
    />
    <template #footer>
      <button type="button" class="btn btn-ghost" @click="close">取消</button>
      <button type="button" class="btn btn-primary" @click="onConfirm">提交</button>
    </template>
  </el-dialog>
</template>
