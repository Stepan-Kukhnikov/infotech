<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useToastStore } from '@/stores/toasts'

const store = useToastStore()
const { toasts } = storeToRefs(store)
</script>

<template>
  <div class="toasts" role="status" aria-live="polite">
    <div v-for="toast in toasts" :key="toast.id" class="toast" :class="`toast--${toast.kind}`">
      <span>{{ toast.message }}</span>
      <button
        type="button"
        class="toast__close"
        aria-label="Закрыть уведомление"
        @click="store.dismiss(toast.id)"
      >
        ×
      </button>
    </div>
  </div>
</template>
