<script setup lang="ts">
import { useRouter } from 'vue-router'

import AppButton from '@/shared/ui/AppButton.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

function handleLogout(): void {
  auth.logout()
  void router.push('/books')
}
</script>

<template>
  <div class="layout">
    <a class="skip-link" href="#main">Перейти к содержимому</a>

    <header class="header">
      <div class="header__inner">
        <RouterLink to="/books" class="header__logo">Каталог книг</RouterLink>

        <nav class="nav" aria-label="Основная навигация">
          <RouterLink to="/books" class="nav__link" active-class="nav__link--active">
            Книги
          </RouterLink>
          <RouterLink to="/authors" class="nav__link" active-class="nav__link--active">
            Авторы
          </RouterLink>
          <RouterLink to="/report" class="nav__link" active-class="nav__link--active">
            Отчёт
          </RouterLink>
        </nav>

        <div class="header__auth">
          <template v-if="auth.isAuthenticated">
            <span class="header__user">
              {{ auth.user?.username }}
              <span class="badge">{{ auth.user?.role }}</span>
            </span>
            <AppButton variant="ghost" size="sm" @click="handleLogout">Выйти</AppButton>
          </template>
          <template v-else>
            <span class="badge">гость</span>
            <AppButton variant="secondary" size="sm" @click="router.push('/login')">
              Войти
            </AppButton>
          </template>
        </div>
      </div>
    </header>

    <main id="main" class="main">
      <RouterView />
    </main>

    <footer class="footer">
      <p>Подвал :)</p>
    </footer>
  </div>
</template>
