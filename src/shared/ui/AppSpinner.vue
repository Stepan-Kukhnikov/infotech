<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: 'Загрузка' })
</script>

<template>
  <span class="spinner" role="status" aria-live="polite">
    <span class="visually-hidden">{{ label }}</span>
  </span>
</template>
