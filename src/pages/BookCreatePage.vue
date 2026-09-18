<script setup lang="ts">
import { useRouter } from 'vue-router'

import type { BookFormPayload, BookInput } from '@/shared/api/types'
import { useDocumentTitle } from '@/shared/lib/composables'
import { useToastStore } from '@/stores/toasts'

import BookForm from '@/features/books/BookForm.vue'
import { useCreateBookMutation } from '@/features/books/queries'

useDocumentTitle(() => 'Новая книга')

const router = useRouter()
const toasts = useToastStore()
const mutation = useCreateBookMutation()

async function handleSubmit(payload: BookFormPayload | BookInput): Promise<void> {
  const book = await mutation.mutateAsync(payload as BookFormPayload)
  toasts.notify('success', 'Книга добавлена')
  await router.replace(`/books/${book.id}`)
}
</script>

<template>
  <div class="page page--narrow">
    <h1 class="page__title">Новая книга</h1>

    <BookForm
      mode="create"
      :submitting="mutation.isPending.value"
      :on-submit="handleSubmit"
      @cancel="router.back()"
    />
  </div>
</template>
