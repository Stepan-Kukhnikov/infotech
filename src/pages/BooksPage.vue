<script setup lang="ts">
import { ref, watch } from 'vue'

import { getErrorMessage } from '@/shared/api/errors'
import { useDebouncedRef, useDocumentTitle } from '@/shared/lib/composables'
import { CURRENT_YEAR, MIN_BOOK_YEAR } from '@/shared/lib/format'
import AppButton from '@/shared/ui/AppButton.vue'
import AppPagination from '@/shared/ui/AppPagination.vue'
import LinkButton from '@/shared/ui/LinkButton.vue'
import SkeletonList from '@/shared/ui/SkeletonList.vue'
import StateBlock from '@/shared/ui/States.vue'
import { useAuthStore } from '@/stores/auth'

import BookCard from '@/features/books/BookCard.vue'
import { useBooksQuery } from '@/features/books/queries'
import { useBookListParams } from '@/features/books/useBookListParams'

useDocumentTitle(() => 'Каталог книг')

const auth = useAuthStore()
const { params, update, reset, isFiltered } = useBookListParams()

const searchInput = ref(params.value.search ?? '')
const debouncedSearch = useDebouncedRef(searchInput)

watch(debouncedSearch, (value) => {
  if (value !== (params.value.search ?? '')) update({ search: value || undefined })
})

const { data, isPending, isError, error, isFetching, refetch } = useBooksQuery(params)

function clearFilters(): void {
  searchInput.value = ''
  reset()
}
</script>

<template>
  <div class="page">
    <header class="page__header">
      <div>
        <h1 class="page__title">Каталог книг</h1>
        <p v-if="data" class="page__subtitle">Всего книг: {{ data.pagination.total }}</p>
      </div>
      <LinkButton v-if="auth.isAuthenticated" to="/books/new">Добавить книгу</LinkButton>
    </header>

    <section class="filters" aria-label="Фильтры каталога">
      <div class="filters__field">
        <label class="field__label" for="filter-search">Поиск</label>
        <input
          id="filter-search"
          v-model="searchInput"
          type="search"
          class="input"
          placeholder="Название, описание, ISBN"
        />
      </div>

      <div class="filters__field filters__field--narrow">
        <label class="field__label" for="filter-year">Год</label>
        <input
          id="filter-year"
          type="number"
          class="input"
          placeholder="Любой"
          :min="MIN_BOOK_YEAR"
          :max="CURRENT_YEAR"
          :value="params.year ?? ''"
          @input="update({ year: ($event.target as HTMLInputElement).value || undefined })"
        />
      </div>

      <AppButton v-if="isFiltered" variant="ghost" @click="clearFilters">Сбросить</AppButton>

      <span v-if="isFetching && !isPending" class="filters__status">Обновление…</span>
    </section>

    <SkeletonList v-if="isPending" :count="8" />

    <StateBlock
      v-else-if="isError"
      variant="error"
      title="Не удалось загрузить данные"
      :message="getErrorMessage(error)"
      @retry="refetch()"
    />

    <StateBlock
      v-else-if="data && data.items.length === 0"
      title="Книги не найдены"
      :message="
        isFiltered
          ? 'Попробуйте изменить условия фильтрации.'
          : 'В каталоге пока нет ни одной книги.'
      "
    >
      <template #action>
        <AppButton v-if="isFiltered" variant="secondary" @click="clearFilters">
          Сбросить фильтры
        </AppButton>
      </template>
    </StateBlock>

    <template v-else-if="data">
      <div class="books-grid">
        <BookCard v-for="book in data.items" :key="book.id" :book="book" />
      </div>
      <AppPagination :pagination="data.pagination" @change="(page) => update({ page })" />
    </template>
  </div>
</template>
