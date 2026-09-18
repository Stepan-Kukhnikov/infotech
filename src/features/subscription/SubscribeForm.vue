<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { ref } from 'vue'
import { z } from 'zod'

import { applyServerErrors } from '@/shared/lib/form'
import { normalizePhone } from '@/shared/lib/format'
import AppButton from '@/shared/ui/AppButton.vue'
import TextField from '@/shared/ui/TextField.vue'
import { useToastStore } from '@/stores/toasts'

import { useSubscribeMutation } from '@/features/authors/queries'

const subscribeSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, 'Укажите номер телефона')
    .refine(
      (value) => normalizePhone(value) !== null,
      'Введите российский номер, например +7 999 123-45-67',
    )
    .transform((value) => normalizePhone(value)!),
})

const props = defineProps<{ authorId: number; authorName: string }>()

const toasts = useToastStore()
const mutation = useSubscribeMutation(() => props.authorId)

const formError = ref<string | null>(null)
const done = ref(false)

const { handleSubmit, errors, setFieldError, defineField, resetForm } = useForm({
  validationSchema: toTypedSchema(subscribeSchema),
  initialValues: { phone: '' },
})

const [phone] = defineField('phone')

const submit = handleSubmit(async (values) => {
  formError.value = null
  try {
    await mutation.mutateAsync({ phone: values.phone })
    done.value = true
    resetForm()
    toasts.notify('success', `Подписка на новинки: ${props.authorName}`)
  } catch (error) {
    formError.value = applyServerErrors(error, setFieldError, ['phone'])
  }
})
</script>

<template>
  <div v-if="done" class="alert alert--success" role="status">
    Подписка оформлена. SMS придёт, когда у автора появится новая книга.
    <button type="button" class="link-button" @click="done = false">Добавить ещё номер</button>
  </div>

  <form v-else class="subscribe" novalidate @submit="submit">
    <h3 class="subscribe__title">Подписка на новинки</h3>
    <p class="subscribe__text">
      Оставьте номер — пришлём SMS, когда у автора выйдет новая книга. Регистрация не нужна.
    </p>

    <div v-if="formError" class="alert alert--error" role="alert">{{ formError }}</div>

    <div class="subscribe__row">
      <TextField
        v-model="phone"
        label="Телефон"
        type="tel"
        autocomplete="tel"
        placeholder="+7 999 123-45-67"
        :error="errors.phone"
      />
      <AppButton type="submit" :loading="mutation.isPending.value">Подписаться</AppButton>
    </div>
  </form>
</template>
