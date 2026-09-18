<script setup lang="ts">
import { computed, ref } from 'vue'

import { useDebouncedRef } from '@/shared/lib/composables'
import AppSpinner from '@/shared/ui/AppSpinner.vue'

import { useAuthorsQuery } from './queries'

const props = withDefaults(
  defineProps<{
    modelValue: number[]
    error?: string
    initialLabels?: Record<number, string>
  }>(),
  { initialLabels: () => ({}) },
)

const emit = defineEmits<{ 'update:modelValue': [ids: number[]] }>()

const search = ref('')
const debouncedSearch = useDebouncedRef(search)

const { data, isLoading } = useAuthorsQuery(() => ({
  page: 1,
  perPage: 20,
  search: debouncedSearch.value || undefined,
}))

const labels = computed<Record<number, string>>(() => {
  const result: Record<number, string> = { ...props.initialLabels }
  for (const author of data.value?.items ?? []) result[author.id] = author.full_name
  return result
})

function toggle(id: number): void {
  const next = props.modelValue.includes(id)
    ? props.modelValue.filter((item) => item !== id)
    : [...props.modelValue, id]
  emit('update:modelValue', next)
}
</script>

<template>
  <div class="field" :class="{ 'field--invalid': error }">
    <span class="field__label">
      Авторы
      <span class="field__required" aria-hidden="true">*</span>
    </span>

    <ul v-if="modelValue.length > 0" class="chips" aria-label="Выбранные авторы">
      <li v-for="id in modelValue" :key="id" class="chip">
        {{ labels[id] ?? `Автор #${id}` }}
        <button
          type="button"
          class="chip__remove"
          :aria-label="`Убрать автора ${labels[id] ?? id}`"
          @click="toggle(id)"
        >
          ×
        </button>
      </li>
    </ul>

    <input
      v-model="search"
      type="search"
      class="input"
      placeholder="Начните вводить ФИО автора"
      aria-label="Поиск автора"
    />

    <div class="picker">
      <AppSpinner v-if="isLoading" />
      <p v-else-if="(data?.items.length ?? 0) === 0" class="picker__empty">Авторы не найдены</p>
      <button
        v-for="author in data?.items ?? []"
        :key="author.id"
        type="button"
        class="picker__item"
        :class="{ 'picker__item--selected': modelValue.includes(author.id) }"
        :aria-pressed="modelValue.includes(author.id)"
        @click="toggle(author.id)"
      >
        {{ author.full_name }}
      </button>
    </div>

    <p v-if="error" class="field__error" role="alert">{{ error }}</p>
  </div>
</template>
