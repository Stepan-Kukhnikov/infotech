<script setup lang="ts">
import AppButton from './AppButton.vue'
import AppModal from './AppModal.vue'

withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    confirmLabel?: string
    loading?: boolean
  }>(),
  { confirmLabel: 'Удалить', loading: false },
)

const emit = defineEmits<{ confirm: []; cancel: [] }>()
</script>

<template>
  <AppModal :open="open" :title="title" @close="emit('cancel')">
    <p class="modal__text">{{ message }}</p>

    <template #footer>
      <AppButton variant="secondary" :disabled="loading" @click="emit('cancel')">
        Отмена
      </AppButton>
      <AppButton variant="danger" :loading="loading" @click="emit('confirm')">
        {{ confirmLabel }}
      </AppButton>
    </template>
  </AppModal>
</template>
