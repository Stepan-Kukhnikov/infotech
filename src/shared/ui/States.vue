<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    message?: string
    variant?: 'empty' | 'error'
  }>(),
  { variant: 'empty' },
)

defineEmits<{ retry: [] }>()
</script>

<template>
  <div
    class="state"
    :class="{ 'state--error': variant === 'error' }"
    :role="variant === 'error' ? 'alert' : undefined"
  >
    <h2 class="state__title">{{ title }}</h2>
    <p v-if="message" class="state__text">{{ message }}</p>
    <slot name="action">
      <button
        v-if="variant === 'error'"
        type="button"
        class="btn btn--secondary"
        @click="$emit('retry')"
      >
        Повторить
      </button>
    </slot>
  </div>
</template>
