<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getErrorMessage } from '@/shared/api/errors'
import type { AuthorInput } from '@/shared/api/types'
import { useDocumentTitle } from '@/shared/lib/composables'
import { pluralizeBooks } from '@/shared/lib/format'
import AppButton from '@/shared/ui/AppButton.vue'
import AppSpinner from '@/shared/ui/AppSpinner.vue'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import LinkButton from '@/shared/ui/LinkButton.vue'
import StateBlock from '@/shared/ui/States.vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'

import AuthorFormModal from '@/features/authors/AuthorFormModal.vue'
import {
  useAuthorQuery,
  useDeleteAuthorMutation,
  useUpdateAuthorMutation,
} from '@/features/authors/queries'
import SubscribeForm from '@/features/subscription/SubscribeForm.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toasts = useToastStore()

const authorId = computed(() => Number(route.params.id))
const editOpen = ref(false)
const confirmOpen = ref(false)

const { data: author, isPending, isError, error, refetch } = useAuthorQuery(authorId)
const updateMutation = useUpdateAuthorMutation(authorId)
const deleteMutation = useDeleteAuthorMutation()

useDocumentTitle(() => author.value?.full_name ?? 'Автор')

const books = computed(() => author.value?.books ?? [])

async function handleUpdate(values: AuthorInput): Promise<void> {
  await updateMutation.mutateAsync(values)
  toasts.notify('success', 'Автор обновлён')
  editOpen.value = false
}

async function handleDelete(): Promise<void> {
  try {
    await deleteMutation.mutateAsync(authorId.value)
    toasts.notify('success', 'Автор удалён')
    await router.replace('/authors')
  } catch (deleteError) {
    toasts.notify('error', getErrorMessage(deleteError))
    confirmOpen.value = false
  }
}
</script>

<template>
  <div v-if="isPending" class="page page--center"><AppSpinner /></div>

  <div v-else-if="isError" class="page">
    <StateBlock
      variant="error"
      title="Автор недоступен"
      :message="getErrorMessage(error)"
      @retry="refetch()"
    />
    <LinkButton to="/authors" variant="secondary">К списку авторов</LinkButton>
  </div>

  <div v-else-if="author" class="page">
    <nav class="breadcrumbs" aria-label="Хлебные крошки">
      <RouterLink to="/authors">Авторы</RouterLink>
      <span aria-hidden="true">/</span>
      <span>{{ author.full_name }}</span>
    </nav>

    <header class="page__header">
      <div>
        <h1 class="page__title">{{ author.full_name }}</h1>
        <p class="page__subtitle">В каталоге: {{ pluralizeBooks(books.length) }}</p>
      </div>

      <div v-if="auth.isAuthenticated" class="page__actions">
        <AppButton variant="secondary" @click="editOpen = true">Переименовать</AppButton>
        <AppButton variant="danger" @click="confirmOpen = true">Удалить</AppButton>
      </div>
    </header>

    <SubscribeForm
      v-if="!auth.isAuthenticated"
      :author-id="authorId"
      :author-name="author.full_name"
    />

    <section>
      <h2 class="section-title">Книги автора</h2>

      <StateBlock
        v-if="books.length === 0"
        title="Книг пока нет"
        message="У этого автора ещё нет книг в каталоге."
      />

      <ul v-else class="author-books">
        <li v-for="book in books" :key="book.id" class="author-books__item">
          <RouterLink :to="`/books/${book.id}`">{{ book.title }}</RouterLink>
          <span class="author-books__year">{{ book.year }}</span>
        </li>
      </ul>
    </section>

    <AuthorFormModal
      v-if="editOpen"
      open
      title="Изменить автора"
      :initial-name="author.full_name"
      :submitting="updateMutation.isPending.value"
      :on-submit="handleUpdate"
      @close="editOpen = false"
    />

    <ConfirmDialog
      :open="confirmOpen"
      title="Удалить автора?"
      :message="
        books.length > 0
          ? `У автора ${books.length} книг(и) в каталоге. Удаление может затронуть и их.`
          : `Автор «${author.full_name}» будет удалён.`
      "
      :loading="deleteMutation.isPending.value"
      @confirm="handleDelete"
      @cancel="confirmOpen = false"
    />
  </div>
</template>
