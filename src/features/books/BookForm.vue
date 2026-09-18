<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useField, useForm } from 'vee-validate'
import { computed, ref } from 'vue'

import type { Book, BookFormPayload, BookInput } from '@/shared/api/types'
import { applyServerErrors } from '@/shared/lib/form'
import { CURRENT_YEAR, MIN_BOOK_YEAR } from '@/shared/lib/format'
import AppButton from '@/shared/ui/AppButton.vue'
import TextField from '@/shared/ui/TextField.vue'

import AuthorPicker from '@/features/authors/AuthorPicker.vue'

import CoverField from './CoverField.vue'
import { createBookSchema } from './schema'

const props = defineProps<{
  mode: 'create' | 'edit'
  book?: Book
  submitting: boolean
  onSubmit: (payload: BookFormPayload | BookInput) => Promise<void>
}>()

const emit = defineEmits<{ cancel: [] }>()

const FIELDS = ['title', 'year', 'description', 'isbn', 'author_ids', 'cover'] as const

const formError = ref<string | null>(null)

const { handleSubmit, errors, setFieldError, defineField, meta } = useForm({
  validationSchema: toTypedSchema(createBookSchema(props.mode)),
  initialValues: {
    title: props.book?.title ?? '',
    year: props.book?.year ?? CURRENT_YEAR,
    description: props.book?.description ?? '',
    isbn: props.book?.isbn ?? '',
    author_ids: props.book?.authors?.map((author) => author.id) ?? [],
    cover: undefined,
  },
  validateOnMount: false,
})

const [title] = defineField('title')
const [year] = defineField('year')
const [isbn] = defineField('isbn')
const [description] = defineField('description')

const { value: authorIds } = useField<number[]>('author_ids')
const { value: cover } = useField<File | undefined>('cover')

const initialLabels = computed(() =>
  Object.fromEntries((props.book?.authors ?? []).map((author) => [author.id, author.full_name])),
)

const submit = handleSubmit(async (values) => {
  formError.value = null

  const base = {
    title: values.title,
    year: values.year,
    description: values.description || undefined,
    isbn: values.isbn || undefined,
    author_ids: values.author_ids,
  }

  const payload: BookFormPayload | BookInput = values.cover
    ? { ...base, cover: values.cover }
    : base

  try {
    await props.onSubmit(payload)
  } catch (error) {
    formError.value = applyServerErrors(error, setFieldError, FIELDS)
  }
})
</script>

<template>
  <form class="form" novalidate @submit="submit">
    <div v-if="formError" class="alert alert--error" role="alert">{{ formError }}</div>

    <TextField
      v-model="title"
      name="title"
      label="Название"
      required
      placeholder="Например: Мастер и Маргарита"
      :error="errors.title"
    />

    <TextField
      v-model="year"
      name="year"
      label="Год выпуска"
      required
      type="number"
      inputmode="numeric"
      :min="MIN_BOOK_YEAR"
      :max="CURRENT_YEAR"
      :error="errors.year"
    />

    <TextField
      v-model="isbn"
      name="isbn"
      label="ISBN"
      placeholder="978-5-389-21499-7"
      hint="Необязательно. Проверяется контрольная сумма ISBN-10 и ISBN-13"
      :error="errors.isbn"
    />

    <TextField
      v-model="description"
      name="description"
      label="Описание"
      multiline
      rows="5"
      placeholder="Краткая аннотация"
      :error="errors.description"
    />

    <AuthorPicker
      v-model="authorIds"
      :error="errors.author_ids"
      :initial-labels="initialLabels"
    />

    <CoverField
      v-model="cover"
      :error="errors.cover"
      :current-url="book?.cover_url"
      :required="mode === 'create'"
    />

    <p v-if="mode === 'edit'" class="form__note">
      Обложку можно не трогать — тогда изменения уйдут методом PATCH, и файл не
      перезаливается.
    </p>

    <div class="form__actions">
      <AppButton type="submit" :loading="submitting" :disabled="mode === 'edit' && !meta.dirty">
        {{ mode === 'create' ? 'Создать книгу' : 'Сохранить' }}
      </AppButton>
      <AppButton variant="secondary" :disabled="submitting" @click="emit('cancel')">
        Отмена
      </AppButton>
    </div>
  </form>
</template>
