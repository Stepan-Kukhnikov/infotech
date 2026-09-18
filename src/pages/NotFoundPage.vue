<script setup lang="ts">
import { useDocumentTitle } from '@/shared/lib/composables'
import LinkButton from '@/shared/ui/LinkButton.vue'

useDocumentTitle(() => 'Страница не найдена')
</script>

<template>
  <div class="page page--center">
    <h1 class="page__title">404 — страница не найдена</h1>
    <p class="page__subtitle">Такой страницы нет. Возможно, ссылка устарела.</p>
    <LinkButton to="/books">Вернуться в каталог</LinkButton>
  </div>
</template>
