<script setup lang="ts">
import { computed, useId } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  label: string
  error?: string
  hint?: string
  required?: boolean
  multiline?: boolean
}>()

const model = defineModel<string | number>()

const id = useId()
const errorId = `${id}-error`
const hintId = `${id}-hint`

const describedBy = computed(() => {
  const ids = [props.error ? errorId : null, props.hint && !props.error ? hintId : null]
  return ids.filter(Boolean).join(' ') || undefined
})
</script>

<template>
  <div class="field" :class="{ 'field--invalid': error }">
    <label class="field__label" :for="id">
      {{ label }}
      <span v-if="required" class="field__required" aria-hidden="true">*</span>
    </label>

    <textarea
      v-if="multiline"
      :id="id"
      v-model="model"
      class="input input--textarea"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy"
      v-bind="$attrs"
    />
    <input
      v-else
      :id="id"
      v-model="model"
      class="input"
      :aria-invalid="error ? true : undefined"
      :aria-describedby="describedBy"
      v-bind="$attrs"
    />

    <p v-if="hint && !error" :id="hintId" class="field__hint">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="field__error" role="alert">{{ error }}</p>
  </div>
</template>
