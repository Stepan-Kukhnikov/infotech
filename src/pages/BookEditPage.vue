<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getErrorMessage } from '@/shared/api/errors'
import type { BookFormPayload, BookInput } from '@/shared/api/types'
import { useDocumentTitle } from '@/shared/lib/composables'
import AppSpinner from '@/shared/ui/AppSpinner.vue'
import StateBlock from '@/shared/ui/States.vue'
import { useToastStore } from '@/stores/toasts'

import BookForm from '@/features/books/BookForm.vue'
import { useBookQuery, useUpdateBookMutation } from '@/features/books/queries'

const route = useRoute()
const router = useRouter()
const toasts = useToastStore()

const bookId = computed(() => Number(route.params.id))

const { data: book, isPending, isError, error, refetch } = useBookQuery(bookId)
const mutation = useUpdateBookMutation(bookId)

useDocumentTitle(() =>
  book.value ? `Редактирование: ${book.value.title}` : 'Редактирование книги',
)

async function handleSubmit(payload: BookFormPayload | BookInput): Promise<void> {
  await mutation.mutateAsync(payload)
  toasts.notify('success', 'Изменения сохранены')
  await router.replace(`/books/${bookId.value}`)
}
</script>

<template>
  <div v-if="isPending" class="page page--center"><AppSpinner /></div>

  <div v-else-if="isError" class="page">
    <StateBlock
      variant="error"
      title="Не удалось загрузить данные"
      :message="getErrorMessage(error)"
      @retry="refetch()"
    />
  </div>

  <div v-else-if="book" class="page page--narrow">
    <h1 class="page__title">Редактирование книги</h1>

    <BookForm
      :key="book.id"
      mode="edit"
      :book="book"
      :submitting="mutation.isPending.value"
      :on-submit="handleSubmit"
      @cancel="router.push(`/books/${bookId}`)"
    />
  </div>
</template>
