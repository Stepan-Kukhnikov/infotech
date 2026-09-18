<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getErrorMessage } from '@/shared/api/errors'
import { useDocumentTitle } from '@/shared/lib/composables'
import AppButton from '@/shared/ui/AppButton.vue'
import AppSpinner from '@/shared/ui/AppSpinner.vue'
import ConfirmDialog from '@/shared/ui/ConfirmDialog.vue'
import LinkButton from '@/shared/ui/LinkButton.vue'
import StateBlock from '@/shared/ui/States.vue'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toasts'

import { useBookQuery, useDeleteBookMutation } from '@/features/books/queries'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toasts = useToastStore()

const bookId = computed(() => Number(route.params.id))
const confirmOpen = ref(false)

const { data: book, isPending, isError, error, refetch } = useBookQuery(bookId)
const deleteMutation = useDeleteBookMutation()

useDocumentTitle(() => book.value?.title ?? 'Книга')

async function handleDelete(): Promise<void> {
  try {
    await deleteMutation.mutateAsync(bookId.value)
    toasts.notify('success', 'Книга удалена')
    await router.replace('/books')
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
      title="Книга недоступна"
      :message="getErrorMessage(error)"
      @retry="refetch()"
    />
    <LinkButton to="/books" variant="secondary">К каталогу</LinkButton>
  </div>

  <div v-else-if="book" class="page">
    <nav class="breadcrumbs" aria-label="Хлебные крошки">
      <RouterLink to="/books">Каталог</RouterLink>
      <span aria-hidden="true">/</span>
      <span>{{ book.title }}</span>
    </nav>

    <div class="book-detail">
      <div class="book-detail__cover-wrap">
        <img
          v-if="book.cover_url"
          class="book-detail__cover"
          :src="book.cover_url"
          :alt="`Обложка: ${book.title}`"
        />
        <div v-else class="book-detail__cover book-detail__cover--empty">Без обложки</div>
      </div>

      <div class="book-detail__info">
        <h1 class="page__title">{{ book.title }}</h1>

        <dl class="definition-list">
          <div class="definition-list__row">
            <dt>Год выпуска</dt>
            <dd>{{ book.year }}</dd>
          </div>
          <div class="definition-list__row">
            <dt>ISBN</dt>
            <dd>{{ book.isbn || '—' }}</dd>
          </div>
          <div class="definition-list__row">
            <dt>Авторы</dt>
            <dd>
              <ul v-if="book.authors && book.authors.length > 0" class="inline-list">
                <li v-for="author in book.authors" :key="author.id">
                  <RouterLink :to="`/authors/${author.id}`">{{ author.full_name }}</RouterLink>
                </li>
              </ul>
              <template v-else>—</template>
            </dd>
          </div>
        </dl>

        <div v-if="book.description" class="book-detail__description">
          <h2 class="section-title">Описание</h2>
          <p>{{ book.description }}</p>
        </div>

        <div v-if="auth.isAuthenticated" class="book-detail__actions">
          <LinkButton :to="`/books/${book.id}/edit`" variant="secondary">Редактировать</LinkButton>
          <AppButton variant="danger" @click="confirmOpen = true">Удалить</AppButton>
        </div>
      </div>
    </div>

    <ConfirmDialog
      :open="confirmOpen"
      title="Удалить книгу?"
      :message="`Книга «${book.title}» будет удалена без возможности восстановления.`"
      :loading="deleteMutation.isPending.value"
      @confirm="handleDelete"
      @cancel="confirmOpen = false"
    />
  </div>
</template>
