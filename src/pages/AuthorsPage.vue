<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getErrorMessage } from '@/shared/api/errors'
import type { AuthorInput } from '@/shared/api/types'
import { useDebouncedRef, useDocumentTitle } from '@/shared/lib/composables'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPagination from '@/shared/ui/AppPagination.vue'
import AppSpinner from '@/shared/ui/AppSpinner.vue'
import StateBlock from '@/shared/ui/States.vue'
import { useToastStore } from '@/stores/toasts'
import { useAuthStore } from '@/stores/auth'

import AuthorFormModal from '@/features/authors/AuthorFormModal.vue'
import { useAuthorsQuery, useCreateAuthorMutation } from '@/features/authors/queries'

const PER_PAGE = 20

useDocumentTitle(() => 'Авторы')

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toasts = useToastStore()

const page = computed(() => Number(route.query.page) || 1)
const search = computed(() => (typeof route.query.search === 'string' ? route.query.search : ''))

const searchInput = ref(search.value)
const debouncedSearch = useDebouncedRef(searchInput)

watch(debouncedSearch, (value) => {
  if (value === search.value) return
  const query = { ...route.query }
  if (value) query.search = value
  else delete query.search
  delete query.page
  void router.replace({ query })
})

const { data, isPending, isError, error, refetch } = useAuthorsQuery(() => ({
  page: page.value,
  perPage: PER_PAGE,
  search: search.value || undefined,
}))

const createOpen = ref(false)
const createMutation = useCreateAuthorMutation()

async function handleCreate(values: AuthorInput): Promise<void> {
  await createMutation.mutateAsync(values)
  toasts.notify('success', 'Автор добавлен')
  createOpen.value = false
}

function goToPage(next: number): void {
  void router.push({ query: { ...route.query, page: String(next) } })
}
</script>

<template>
  <div class="page">
    <header class="page__header">
      <div>
        <h1 class="page__title">Авторы</h1>
        <p v-if="data" class="page__subtitle">Всего авторов: {{ data.pagination.total }}</p>
      </div>
      <AppButton v-if="auth.isAuthenticated" @click="createOpen = true">Добавить автора</AppButton>
    </header>

    <div class="filters">
      <div class="filters__field">
        <label class="field__label" for="author-search">Поиск по ФИО</label>
        <input
          id="author-search"
          v-model="searchInput"
          type="search"
          class="input"
          placeholder="Например: Булгаков"
        />
      </div>
    </div>

    <div v-if="isPending" class="page--center"><AppSpinner /></div>

    <StateBlock
      v-else-if="isError"
      variant="error"
      title="Не удалось загрузить данные"
      :message="getErrorMessage(error)"
      @retry="refetch()"
    />

    <StateBlock
      v-else-if="data && data.items.length === 0"
      title="Авторы не найдены"
      message="Измените запрос или добавьте нового автора."
    />

    <template v-else-if="data">
      <ul class="authors-list">
        <li v-for="author in data.items" :key="author.id" class="authors-list__item">
          <RouterLink :to="`/authors/${author.id}`">{{ author.full_name }}</RouterLink>
        </li>
      </ul>
      <AppPagination :pagination="data.pagination" @change="goToPage" />
    </template>

    <AuthorFormModal
      v-if="createOpen"
      open
      title="Новый автор"
      :submitting="createMutation.isPending.value"
      :on-submit="handleCreate"
      @close="createOpen = false"
    />
  </div>
</template>
