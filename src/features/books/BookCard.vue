<script setup lang="ts">
import type { Book } from '@/shared/api/types'
import { formatAuthors } from '@/shared/lib/format'

defineProps<{ book: Book }>()
</script>

<template>
  <article class="book-card">
    <RouterLink
      class="book-card__cover-link"
      :to="`/books/${book.id}`"
      tabindex="-1"
      aria-hidden="true"
    >
      <img
        v-if="book.cover_url"
        class="book-card__cover"
        :src="book.cover_url"
        alt=""
        loading="lazy"
        width="200"
        height="280"
      />
      <div v-else class="book-card__cover book-card__cover--empty">Без обложки</div>
    </RouterLink>

    <div class="book-card__body">
      <h3 class="book-card__title">
        <RouterLink :to="`/books/${book.id}`">{{ book.title }}</RouterLink>
      </h3>
      <p class="book-card__meta">{{ book.year }}</p>
      <p class="book-card__authors">{{ formatAuthors(book.authors) }}</p>
    </div>
  </article>
</template>
