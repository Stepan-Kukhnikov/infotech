<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useId, watch } from 'vue'

const props = defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ close: [] }>()

const dialogRef = ref<HTMLDialogElement | null>(null)
const titleId = useId()

function sync(open: boolean): void {
  const dialog = dialogRef.value
  if (!dialog) return

  if (open && !dialog.open) dialog.showModal()
  else if (!open && dialog.open) dialog.close()
}

function handleCancel(event: Event): void {
  event.preventDefault()
  emit('close')
}

onMounted(() => {
  dialogRef.value?.addEventListener('cancel', handleCancel)
  sync(props.open)
})

onBeforeUnmount(() => {
  dialogRef.value?.removeEventListener('cancel', handleCancel)
})

watch(() => props.open, sync)

function handleBackdropClick(event: MouseEvent): void {
  if (event.target === dialogRef.value) emit('close')
}
</script>

<template>
  <dialog ref="dialogRef" class="modal" :aria-labelledby="titleId" @click="handleBackdropClick">
    <div class="modal__body">
      <h2 :id="titleId" class="modal__title">{{ title }}</h2>
      <div class="modal__content"><slot /></div>
      <div v-if="$slots.footer" class="modal__footer"><slot name="footer" /></div>
    </div>
  </dialog>
</template>
