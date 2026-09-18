<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { z } from 'zod'

import { applyServerErrors } from '@/shared/lib/form'
import { useDocumentTitle } from '@/shared/lib/composables'
import AppButton from '@/shared/ui/AppButton.vue'
import TextField from '@/shared/ui/TextField.vue'
import { useAuthStore } from '@/stores/auth'

const loginSchema = z.object({
  username: z.string().trim().min(1, 'Введите логин'),
  password: z.string().min(1, 'Введите пароль'),
})

useDocumentTitle(() => 'Вход')

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const formError = ref<string | null>(null)
const usernameInput = ref<HTMLElement | null>(null)
const isDev = import.meta.env.DEV

const redirectTo = typeof route.query.redirect === 'string' ? route.query.redirect : '/books'

const { handleSubmit, errors, setFieldError, defineField, isSubmitting } = useForm({
  validationSchema: toTypedSchema(loginSchema),
  initialValues: { username: '', password: '' },
})

const [username] = defineField('username')
const [password] = defineField('password')

onMounted(() => {
  usernameInput.value?.querySelector('input')?.focus()
})

const submit = handleSubmit(async (values) => {
  formError.value = null
  try {
    await auth.login(values)
    await router.replace(redirectTo)
  } catch (error) {
    formError.value = applyServerErrors(error, setFieldError, ['username', 'password'])
  }
})
</script>

<template>
  <div class="page page--narrow">
    <h1 class="page__title">Вход</h1>
    <p class="page__subtitle">
      Просмотр каталога и отчёта доступен без входа. Вход нужен, чтобы добавлять,
      редактировать и удалять книги и авторов.
    </p>

    <form class="form" novalidate @submit="submit">
      <div v-if="formError" class="alert alert--error" role="alert">{{ formError }}</div>

      <div ref="usernameInput">
        <TextField
          v-model="username"
          name="username"
          label="Логин"
          required
          autocomplete="username"
          :error="errors.username"
        />
      </div>

      <TextField
        v-model="password"
        name="password"
        label="Пароль"
        required
        type="password"
        autocomplete="current-password"
        :error="errors.password"
      />

      <div class="form__actions">
        <AppButton type="submit" :loading="isSubmitting">Войти</AppButton>
      </div>
    </form>

    <p v-if="isDev" class="form__note">
      Демо-доступ к мок-серверу: <code>admin</code> / <code>admin</code>
    </p>
  </div>
</template>
