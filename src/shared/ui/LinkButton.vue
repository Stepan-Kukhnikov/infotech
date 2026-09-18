<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

const props = withDefaults(
  defineProps<{
    to: RouteLocationRaw
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
    size?: 'md' | 'sm'
  }>(),
  { variant: 'primary', size: 'md' },
)

const classes = computed(() => [
  'btn',
  `btn--${props.variant}`,
  props.size === 'sm' ? 'btn--sm' : null,
])
</script>

<template>
  <RouterLink :to="to" :class="classes">
    <slot />
  </RouterLink>
</template>
