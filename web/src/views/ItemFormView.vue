<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { fetchCategories } from '../api/categories'
import { createItem, fetchItemDetail, updateItem } from '../api/items'
import type { Category } from '../types'

const route = useRoute()
const router = useRouter()

const isEdit = computed(() => route.name === 'item-edit')
const itemId = computed(() => String(route.params.id || ''))

const loading = ref(false)
const saving = ref(false)
const categories = ref<Category[]>([])
/** 图片预览是否加载失败（常见于防盗链） */
const imagePreviewFailed = ref(false)

const form = reactive({
  title: '',
  description: '',
  price: undefined as number | undefined,
  categoryId: '',
  imageUrl: '',
})

watch(
  () => form.imageUrl,
  () => {
    imagePreviewFailed.value = false
  },
)

/**
 * 预览图加载失败时展示提示
 */
function onPreviewError() {
  imagePreviewFailed.value = true
}

/**
 * 重置表单为空
 */
function resetForm() {
  form.title = ''
  form.description = ''
  form.price = undefined
  form.categoryId = ''
  form.imageUrl = ''
}

/**
 * 加载分类与（编辑时）商品详情
 */
async function bootstrap() {
  loading.value = true
  try {
    if (!categories.value.length) {
      const catRes = await fetchCategories()
      if (catRes.success) categories.value = catRes.data
    }

    if (isEdit.value) {
      const res = await fetchItemDetail(itemId.value)
      if (!res.success) {
        router.replace('/my/items')
        return
      }
      form.title = res.data.title
      form.description = res.data.description || ''
      form.price = Number(res.data.price)
      form.categoryId = res.data.categoryId || ''
      form.imageUrl = res.data.imageUrl || ''
    } else {
      resetForm()
    }
  } catch {
    if (isEdit.value) router.replace('/my/items')
  } finally {
    loading.value = false
  }
}

/**
 * 提交表单
 */
async function onSubmit() {
  if (!form.title.trim()) {
    ElMessage.warning('请填写标题')
    return
  }
  if (form.price === undefined || Number(form.price) <= 0) {
    ElMessage.warning('价格须大于 0')
    return
  }

  saving.value = true
  try {
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      categoryId: form.categoryId || null,
      imageUrl: form.imageUrl.trim() || null,
    }
    const res = isEdit.value
      ? await updateItem(itemId.value, payload)
      : await createItem(payload)

    if (res.success) {
      ElMessage.success(res.message || '保存成功')
      router.push(`/items/${res.data.id}`)
    }
  } catch {
    /* 拦截器已提示 */
  } finally {
    saving.value = false
  }
}

watch(
  () => [route.name, route.params.id],
  () => {
    bootstrap()
  },
)

onMounted(bootstrap)
</script>

<template>
  <div v-loading="loading" class="form-page">
    <p class="eyebrow">{{ isEdit ? 'Edit / 编辑商品' : 'Publish / 发布商品' }}</p>
    <h1 class="page-title">{{ isEdit ? '编辑商品' : '发布闲置' }}</h1>

    <form class="panel form-panel" @submit.prevent="onSubmit">
      <el-form label-position="top">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" maxlength="80" show-word-limit placeholder="一句话说明闲置" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="5"
            maxlength="1000"
            show-word-limit
            placeholder="成色、交易方式、面交地点等"
          />
        </el-form-item>
        <div class="form-row">
          <el-form-item label="价格（元）" required class="form-row__item">
            <el-input-number
              v-model="form.price"
              :min="0.01"
              :precision="2"
              :step="1"
              controls-position="right"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="分类" class="form-row__item">
            <el-select
              v-model="form.categoryId"
              clearable
              placeholder="选择分类"
              style="width: 100%"
            >
              <el-option
                v-for="c in categories"
                :key="c.id"
                :label="c.name"
                :value="c.id"
              />
            </el-select>
          </el-form-item>
        </div>
        <el-form-item label="图片 URL">
          <el-input
            v-model="form.imageUrl"
            placeholder="https://…（请使用可公开访问的直链）"
          />
          <p class="form-hint">
            百度图片等搜索结果链常带防盗链，可能无法预览或展示。建议使用图床直链（如
            placehold.co、imgur、或自有 CDN）。
          </p>
        </el-form-item>
        <div v-if="form.imageUrl.trim()" class="preview">
          <img
            v-show="!imagePreviewFailed"
            :src="form.imageUrl.trim()"
            alt="预览"
            referrerpolicy="no-referrer"
            @load="imagePreviewFailed = false"
            @error="onPreviewError"
          />
          <div v-if="imagePreviewFailed" class="preview__error">
            无法加载该图片，请换用可直链访问的地址后再试
          </div>
        </div>
      </el-form>

      <div class="form-actions">
        <button type="button" class="btn btn-ghost" @click="router.back()">取消</button>
        <button type="submit" class="btn btn-accent" :disabled="saving">
          {{ saving ? '保存中…' : isEdit ? '保存修改' : '立即发布' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.form-panel {
  margin-top: 8px;
  max-width: 720px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.form-hint {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--ink-soft);
}

.preview {
  margin-bottom: 16px;
  border-radius: 8px;
  overflow: hidden;
  max-width: 280px;
  border: 1px solid var(--line);
  background: var(--paper);
}

.preview img {
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
}

.preview__error {
  display: grid;
  place-items: center;
  aspect-ratio: 4 / 3;
  padding: 16px;
  text-align: center;
  font-size: 13px;
  line-height: 1.45;
  color: var(--ink-soft);
}

@media (max-width: 860px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
