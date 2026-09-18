<script setup lang="ts">
import { computed } from 'vue'

import type { Pagination } from '@/shared/api/types'

const props = defineProps<{ pagination: Pagination }>()
const emit = defineEmits<{ change: [page: number] }>()

const items = computed<(number | 'gap')[]>(() => {
  const current = props.pagination.page
  const total = props.pagination.total_pages

  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)

  const pages = new Set([1, total, current, current - 1, current + 1])
  const sorted = [...pages].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b)

  const result: (number | 'gap')[] = []
  let previous = 0
  for (const page of sorted) {
    if (previous && page - previous > 1) result.push('gap')
    result.push(page)
    previous = page
  }
  return result
})
</script>

<template>
  <nav v-if="pagination.total_pages > 1" class="pagination" aria-label="Постраничная навигация">
    <button
      type="button"
      class="pagination__btn"
      :disabled="pagination.page <= 1"
      @click="emit('change', pagination.page - 1)"
    >
      Назад
    </button>

    <template v-for="(item, index) in items" :key="item === 'gap' ? `gap-${index}` : item">
      <span v-if="item === 'gap'" class="pagination__gap" aria-hidden="true">…</span>
      <button
        v-else
        type="button"
        class="pagination__btn"
        :class="{ 'pagination__btn--active': item === pagination.page }"
        :aria-current="item === pagination.page ? 'page' : undefined"
        @click="emit('change', item)"
      >
        {{ item }}
      </button>
    </template>

    <button
      type="button"
      class="pagination__btn"
      :disabled="pagination.page >= pagination.total_pages"
      @click="emit('change', pagination.page + 1)"
    >
      Вперёд
    </button>
  </nav>
</template>
