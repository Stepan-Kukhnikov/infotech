<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getErrorMessage } from '@/shared/api/errors'
import { useDocumentTitle } from '@/shared/lib/composables'
import { CURRENT_YEAR, MIN_BOOK_YEAR, pluralizeBooks } from '@/shared/lib/format'
import AppSpinner from '@/shared/ui/AppSpinner.vue'
import StateBlock from '@/shared/ui/States.vue'

import { useTopAuthorsQuery } from '@/features/report/queries'

useDocumentTitle(() => 'ТОП-10 авторов')

const route = useRoute()
const router = useRouter()

const year = computed(() => {
  const parsed = Number(route.query.year)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : CURRENT_YEAR
})

const { data, isPending, isFetching, isError, error, refetch } = useTopAuthorsQuery(year)

const maxCount = computed(() =>
  (data.value?.items ?? []).reduce((max, item) => Math.max(max, item.books_count), 0),
)

function setYear(value: string): void {
  void router.replace({ query: { ...route.query, year: value } })
}
</script>

<template>
  <div class="page">
    <header class="page__header">
      <div>
        <h1 class="page__title">ТОП-10 авторов</h1>
        <p class="page__subtitle">Авторы с наибольшим числом книг за выбранный год</p>
      </div>
    </header>

    <div class="filters">
      <div class="filters__field filters__field--narrow">
        <label class="field__label" for="report-year">Год выпуска</label>
        <input
          id="report-year"
          type="number"
          class="input"
          :min="MIN_BOOK_YEAR"
          :max="CURRENT_YEAR"
          :value="year"
          @input="setYear(($event.target as HTMLInputElement).value)"
        />
      </div>
      <span v-if="isFetching" class="filters__status">Загрузка…</span>
    </div>

    <div v-if="isPending" class="page--center"><AppSpinner /></div>

    <StateBlock
      v-else-if="isError"
      variant="error"
      title="Не удалось загрузить отчёт"
      :message="getErrorMessage(error)"
      @retry="refetch()"
    />

    <StateBlock
      v-else-if="data && data.items.length === 0"
      title="Данных нет"
      :message="`За ${year} год книг в каталоге не найдено.`"
    />

    <table v-else-if="data" class="report-table">
      <caption class="visually-hidden">ТОП-10 авторов за {{ data.year }} год</caption>
      <thead>
        <tr>
          <th scope="col" class="report-table__rank">#</th>
          <th scope="col">Автор</th>
          <th scope="col" class="report-table__count">Книг</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in data.items" :key="item.author_id">
          <td class="report-table__rank">{{ item.rank }}</td>
          <td>
            <RouterLink :to="`/authors/${item.author_id}`">{{ item.full_name }}</RouterLink>
          </td>
          <td class="report-table__count">
            <div class="report-cell">
              <span class="report-bar">
                <span
                  class="report-bar__fill"
                  :style="{ width: `${maxCount ? (item.books_count / maxCount) * 100 : 0}%` }"
                  aria-hidden="true"
                />
              </span>
              <span class="report-bar__value">{{ pluralizeBooks(item.books_count) }}</span>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
