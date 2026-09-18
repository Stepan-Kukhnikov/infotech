import { chromium } from 'playwright'

const BASE = 'http://localhost:4174'
const out = '/tmp/claude-0/-home-claude/f0cc34ac-e7f7-56b2-9f1e-4085f93901b8/scratchpad/vue'

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

const errors = []
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))

async function step(name, fn) {
  try {
    await fn()
    console.log(`OK   ${name}`)
  } catch (e) {
    console.log(`FAIL ${name}: ${e.message}`)
  }
}

await step('каталог загружается', async () => {
  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.waitForSelector('.book-card', { timeout: 15000 })
  const count = await page.locator('.book-card').count()
  if (count !== 12) throw new Error(`ожидалось 12 карточек, получено ${count}`)
  await page.screenshot({ path: `${out}/01-catalog.png`, fullPage: false })
})

await step('поиск фильтрует и пишется в URL', async () => {
  await page.fill('#filter-search', 'Тень')
  await page.waitForTimeout(1200)
  if (!page.url().includes('search=')) throw new Error(`URL без search: ${page.url()}`)
  const count = await page.locator('.book-card').count()
  if (count === 0) throw new Error('поиск ничего не нашёл')
  await page.screenshot({ path: `${out}/02-search.png` })
})

await step('сброс фильтров', async () => {
  await page.getByRole('button', { name: 'Сбросить' }).first().click()
  await page.waitForTimeout(800)
  if (page.url().includes('search=')) throw new Error('search остался в URL')
})

await step('карточка книги', async () => {
  await page.locator('.book-card__title a').first().click()
  await page.waitForSelector('.book-detail', { timeout: 10000 })
  // гость не должен видеть кнопки управления
  if (await page.getByRole('button', { name: 'Удалить' }).count()) {
    throw new Error('гость видит кнопку удаления')
  }
  await page.screenshot({ path: `${out}/03-book.png` })
})

await step('отчёт ТОП-10', async () => {
  await page.goto(`${BASE}/report?year=2020`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.report-table tbody tr', { timeout: 10000 })
  const rows = await page.locator('.report-table tbody tr').count()
  if (rows === 0 || rows > 10) throw new Error(`строк в отчёте: ${rows}`)
  await page.screenshot({ path: `${out}/04-report.png` })
})

await step('гость видит форму подписки у автора', async () => {
  await page.goto(`${BASE}/authors/1`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.subscribe', { timeout: 10000 })
})

await step('валидация телефона отбивает мусор', async () => {
  await page.fill('input[type="tel"]', '12345')
  await page.getByRole('button', { name: 'Подписаться' }).click()
  await page.waitForSelector('.field__error', { timeout: 5000 })
})

await step('подписка с корректным номером проходит', async () => {
  await page.fill('input[type="tel"]', '8 999 123-45-67')
  await page.getByRole('button', { name: 'Подписаться' }).click()
  await page.waitForSelector('.alert--success', { timeout: 10000 })
  await page.screenshot({ path: `${out}/05-subscribe.png` })
})

await step('гарда: /books/new уводит на /login', async () => {
  await page.goto(`${BASE}/books/new`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  if (!page.url().includes('/login')) throw new Error(`остались на ${page.url()}`)
})

await step('неверный пароль -> ошибка', async () => {
  await page.fill('input[autocomplete="username"]', 'admin')
  await page.fill('input[autocomplete="current-password"]', 'wrong')
  await page.locator('#main').getByRole('button', { name: 'Войти' }).click()
  await page.waitForSelector('.field__error, .alert--error', { timeout: 10000 })
})

await step('вход и возврат на исходную страницу', async () => {
  await page.fill('input[autocomplete="current-password"]', 'admin')
  await page.locator('#main').getByRole('button', { name: 'Войти' }).click()
  await page.waitForURL('**/books/new', { timeout: 10000 })
  await page.waitForSelector('form.form', { timeout: 10000 })
  await page.screenshot({ path: `${out}/06-book-form.png` })
})

await step('валидация формы книги без обложки и авторов', async () => {
  await page.fill('input[name="title"]', 'Тестовая книга')
  await page.getByRole('button', { name: 'Создать книгу' }).click()
  await page.waitForTimeout(800)
  const errs = await page.locator('.field__error').count()
  if (errs < 2) throw new Error(`ожидались ошибки по авторам и обложке, найдено ${errs}`)
  await page.screenshot({ path: `${out}/07-validation.png` })
})

await step('создание книги с обложкой', async () => {
  await page.locator('.picker__item').first().click()
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  )
  await page.setInputFiles('input[type="file"]', {
    name: 'cover.png',
    mimeType: 'image/png',
    buffer: png,
  })
  await page.getByRole('button', { name: 'Создать книгу' }).click()
  await page.waitForSelector('.book-detail', { timeout: 15000 })
  const title = await page.locator('h1.page__title').textContent()
  if (!title.includes('Тестовая книга')) throw new Error(`заголовок: ${title}`)
  await page.screenshot({ path: `${out}/08-created.png` })
})

await step('редактирование через PATCH (без новой обложки)', async () => {
  const requests = []
  page.on('request', (r) => {
    if (r.url().includes('/api/v1/books/')) requests.push(r.method())
  })
  await page.getByRole('link', { name: 'Редактировать' }).click()
  await page.waitForSelector('input[name="title"]', { timeout: 10000 })
  await page.fill('input[name="title"]', 'Тестовая книга (изменено)')
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await page.waitForSelector('.book-detail', { timeout: 15000 })
  if (!requests.includes('PATCH')) throw new Error(`методы: ${requests.join(',')}`)
  if (requests.includes('PUT')) throw new Error('ушёл PUT вместо PATCH')
  const title = await page.locator('h1.page__title').textContent()
  if (!title.includes('изменено')) throw new Error(`заголовок: ${title}`)
})

await step('удаление книги с подтверждением', async () => {
  await page.getByRole('button', { name: 'Удалить' }).click()
  await page.waitForSelector('dialog[open]', { timeout: 5000 })
  await page.locator('dialog .btn--danger').click()
  await page.waitForURL('**/books', { timeout: 10000 })
  await page.waitForSelector('.toast--success', { timeout: 5000 })
})

await step('сессия переживает перезагрузку', async () => {
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForSelector('.header__user', { timeout: 10000 })
})

await step('мобильная вёрстка без горизонтального скролла', async () => {
  await page.setViewportSize({ width: 375, height: 800 })
  await page.goto(`${BASE}/books`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.book-card', { timeout: 10000 })
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  )
  if (overflow) throw new Error('есть горизонтальный скролл')
  await page.screenshot({ path: `${out}/09-mobile.png`, fullPage: false })
})

console.log('\nОшибки консоли:', errors.length ? errors : 'нет')
await browser.close()
