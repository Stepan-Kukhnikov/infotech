# Каталог книг

Фронтенд для API каталога книг (Yii2 + MySQL) по спецификации `book.yaml`.

В проект добавлен мок-сервер на MSW — он повторяет
все эндпоинты спеки, включая коды ошибок и задержки. Приложение запускается и кликается
как есть.

## Запуск

```bash
npm install
npm run dev
```

Открыть http://localhost:5173, логин **admin / admin**.

```bash
npm run build      # vue-tsc + сборка
npm run preview
node verify.mjs    # e2e-проверки в Chromium, нужен запущенный preview
```

## Подключение реального бэкенда

Через `.env` (образец — `.env.example`):

```env
VITE_ENABLE_MOCKS=false
VITE_API_BASE_URL=/api/v1
VITE_API_PROXY_TARGET=http://localhost:8080
```

Последняя переменная включает прокси в `vite.config.ts`, чтобы в разработке не ловить
CORS. В продакшене этим занимается nginx.

## Стек

Vue 3 (`<script setup>`) + TypeScript + Vite, Vue Router, Pinia, TanStack Vue Query,
VeeValidate + Zod, MSW для моков.

UI-кит не подключал: компонентов немного, а задание как раз про вёрстку.

## Структура

```
src/
  app/        роутер, layout, queryClient
  pages/      экраны
  features/   auth, books, authors, subscription, report
  shared/     api-слой, ui-компоненты, хелперы
  stores/     Pinia
  mocks/      мок-бэкенд
```

## Про мок-режим

Мок-«база» живёт в памяти вкладки, поэтому перезагрузка страницы возвращает исходные
данные, а загруженные обложки (они хранятся как object URL) пропадают.

Токен храню в localStorage: спека отдаёт его телом ответа, а не httpOnly-кукой,
и `/auth/me` тоже нет, так что после перезагрузки сессию восстановить больше неоткуда.
Если бэкенд перейдёт на куку, `features/auth/tokenStorage.ts` просто удаляется.
