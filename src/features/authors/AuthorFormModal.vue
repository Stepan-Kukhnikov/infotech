<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { ref } from 'vue'
import { z } from 'zod'

import type { AuthorInput } from '@/shared/api/types'
import { applyServerErrors } from '@/shared/lib/form'
import AppButton from '@/shared/ui/AppButton.vue'
import AppModal from '@/shared/ui/AppModal.vue'
import TextField from '@/shared/ui/TextField.vue'

const authorSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, 'ФИО не короче 3 символов')
    .max(255, 'ФИО не длиннее 255 символов')
    .regex(/^[\p{L}\s.'-]+$/u, 'Допустимы только буквы, пробелы, дефис, апостроф и точка'),
})

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    initialName?: string
    submitting: boolean
    onSubmit: (values: AuthorInput) => Promise<void>
  }>(),
  { initialName: '' },
)

const emit = defineEmits<{ close: [] }>()

const formError = ref<string | null>(null)

const { handleSubmit, errors, setFieldError, defineField } = useForm({
  validationSchema: toTypedSchema(authorSchema),
  initialValues: { full_name: props.initialName },
})

const [fullName] = defineField('full_name')

const submit = handleSubmit(async (values) => {
  formError.value = null
  try {
    await props.onSubmit(values)
  } catch (error) {
    formError.value = applyServerErrors(error, setFieldError, ['full_name'])
  }
})
</script>

<template>
  <AppModal :open="open" :title="title" @close="emit('close')">
    <form class="form" novalidate @submit="submit">
      <div v-if="formError" class="alert alert--error" role="alert">{{ formError }}</div>

      <TextField
        v-model="fullName"
        name="full_name"
        label="ФИО автора"
        required
        autofocus
        placeholder="Булгаков Михаил Афанасьевич"
        :error="errors.full_name"
      />

      <div class="form__actions">
        <AppButton type="submit" :loading="submitting">Сохранить</AppButton>
        <AppButton variant="secondary" :disabled="submitting" @click="emit('close')">
          Отмена
        </AppButton>
      </div>
    </form>
  </AppModal>
</template>
