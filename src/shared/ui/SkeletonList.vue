<script setup lang="ts">
withDefaults(defineProps<{ count?: number }>(), { count: 8 })
</script>

<template>
  <div class="skeleton-grid" aria-hidden="true">
    <div v-for="index in count" :key="index" class="skeleton-card">
      <div class="skeleton skeleton--cover" />
      <div class="skeleton skeleton--line" />
      <div class="skeleton skeleton--line skeleton--short" />
    </div>
  </div>
</template>
