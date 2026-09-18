<script setup lang="ts">
import { ref } from 'vue'
import { onErrorCaptured } from 'vue'

import ToastHost from '@/shared/ui/ToastHost.vue'

const fatalError = ref<Error | null>(null)

onErrorCaptured((error) => {
  fatalError.value = error as Error
  console.error('Необработанная ошибка рендера:', error)
  return false
})

function reload(): void {
  window.location.reload()
}
</script>

<template>
  <div v-if="fatalError" class="page page--center">
    <h1 class="page__title">Что-то пошло не так</h1>
    <p class="page__subtitle">Приложение столкнулось с ошибкой. Перезагрузите страницу.</p>
    <button class="btn btn--primary" type="button" @click="reload">
      Перезагрузить
    </button>
  </div>

  <RouterView v-else />
  <ToastHost />
</template>
