import { createRouter, createWebHistory } from 'vue-router'

import AppLayout from '@/app/AppLayout.vue'
import BooksPage from '@/pages/BooksPage.vue'
import { useAuthStore } from '@/stores/auth'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: AppLayout,
      children: [
        { path: '', redirect: '/books' },

        { path: 'books', component: BooksPage },
        {
          path: 'books/new',
          component: () => import('@/pages/BookCreatePage.vue'),
          meta: { requiresAuth: true },
        },
        { path: 'books/:id', component: () => import('@/pages/BookDetailPage.vue') },
        {
          path: 'books/:id/edit',
          component: () => import('@/pages/BookEditPage.vue'),
          meta: { requiresAuth: true },
        },

        { path: 'authors', component: () => import('@/pages/AuthorsPage.vue') },
        { path: 'authors/:id', component: () => import('@/pages/AuthorDetailPage.vue') },

        { path: 'report', component: () => import('@/pages/ReportPage.vue') },
        { path: 'login', component: () => import('@/pages/LoginPage.vue') },

        { path: ':pathMatch(.*)*', component: () => import('@/pages/NotFoundPage.vue') },
      ],
    },
  ],

  scrollBehavior(_to, _from, savedPosition) {
    return savedPosition ?? { top: 0 }
  },
})

router.beforeEach((to) => {
  if (!to.meta.requiresAuth) return true

  const auth = useAuthStore()
  if (auth.isAuthenticated) return true

  return { path: '/login', query: { redirect: to.fullPath } }
})
