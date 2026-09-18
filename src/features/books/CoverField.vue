<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

import { ACCEPTED_COVER_TYPES } from './schema'

const props = defineProps<{
  modelValue: File | undefined
  error?: string
  currentUrl?: string
  required?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [file: File | undefined] }>()

const inputRef = ref<HTMLInputElement | null>(null)
const previewUrl = ref<string | null>(null)

function releasePreview(): void {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

watch(
  () => props.modelValue,
  (file) => {
    releasePreview()
    if (file) previewUrl.value = URL.createObjectURL(file)
  },
  { immediate: true },
)

onBeforeUnmount(releasePreview)

function handleChange(event: Event): void {
  const input = event.target as HTMLInputElement
  emit('update:modelValue', input.files?.[0])
}

function clear(): void {
  emit('update:modelValue', undefined)
  if (inputRef.value) inputRef.value.value = ''
}
</script>

<template>
  <div class="field" :class="{ 'field--invalid': error }">
    <span class="field__label">
      Обложка
      <span v-if="required" class="field__required" aria-hidden="true">*</span>
    </span>

    <div class="cover-field">
      <img
        v-if="previewUrl ?? currentUrl"
        class="cover-field__preview"
        :src="previewUrl ?? currentUrl"
        alt="Превью обложки"
      />
      <div v-else class="cover-field__placeholder" aria-hidden="true">Нет файла</div>

      <div class="cover-field__controls">
        <input
          ref="inputRef"
          type="file"
          class="cover-field__input"
          :accept="ACCEPTED_COVER_TYPES.join(',')"
          :aria-invalid="error ? true : undefined"
          aria-label="Файл обложки"
          @change="handleChange"
        />
        <button v-if="modelValue" type="button" class="link-button" @click="clear">
          Убрать файл
        </button>
        <p class="field__hint">JPEG, PNG или WebP, до 5 МБ</p>
      </div>
    </div>

    <p v-if="error" class="field__error" role="alert">{{ error }}</p>
  </div>
</template>
