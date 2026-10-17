# BookNest

Накопительный учебный проект курса «Современные веб-технологии». Текущий этап — часть B ЛР6: React Router, URL-состояние каталога и единая create/edit форма на React Hook Form и Zod.

## Запуск

```powershell
cd booknest-web
npm ci
npm run dev
```

Vite выведет локальный URL. Для production-проверки: `npm run build`, затем `npm run preview`.

## Возможности

- Поиск по названию и автору с debounce 350 мс, фильтры по жанру и доступности, три сортировки и сброс.
- Пагинация Open Library по 20 записей, счётчик результатов и блокировка кнопок на границах.
- Взаимоисключающие состояния loading, success, empty и error; Retry и отдельные сообщения network, 4xx, 5xx и timeout.
- Отмена устаревших запросов через `AbortController` и cleanup общего `useFetch<T>`; отдельная загрузка страницы книги и обработка 404.
- Wishlist и локальные учебные записи в `localStorage`, включая миграцию данных ЛР3/ЛР4.
- Маршруты каталога, деталей, create/edit формы, wishlist, login и 404; поиск, фильтры, сортировка и страница хранятся в query string.
- Единая форма из восьми полей с клиентской и межполевой Zod-валидацией, prefill и отображением mock-ошибок 422/409/500.
- Защищённый `/wishlist` с локальной заглушкой входа и возвратом на исходный URL.
- Адаптивность 375 / 768 / 1440 px, сохраняемый переключатель светлой/тёмной темы, клавиатурная навигация.

## Архитектура

- `booknest-web/src/app/` содержит дерево nested routes, общий layout и `RequireAuth`; `App` владеет wishlist.
- `booknest-web/src/pages/` содержит тонкие компоненты маршрутов, `features/` — каталог, детали, wishlist и форму.
- `booknest-web/src/api/` изолирует `fetch`, нормализацию ответов и типизированные ошибки.
- `booknest-web/src/shared/hooks/` содержит `useFetch<T>` и `useDebounce<T>`; `features/books/useBooks.ts` связывает hooks с API.
- `booknest-web/src/shared/contexts/` содержит только `ThemeContext` и `AuthContext` с локальной заглушкой читателя.
- `booknest-web/src/shared/` содержит UI, preferences, URL helpers и Zod-схему формы.
- `booknest-web/src/types.ts` содержит предметные интерфейсы и union-типы.
- `booknest-web/src/styles/` сохраняет дизайн-токены, Grid/Flexbox и темы ЛР2–4.

Подробные границы слоёв и маршруты: [docs/lab6b/architecture.md](docs/lab6b/architecture.md).

## Практические занятия 2–7

Матрица обязательных требований, ссылки на исторические реализации и честно отмеченные ручные действия собраны в [docs/practices/README.md](docs/practices/README.md). Практики оформлены отдельными коммитами ветки `coursework/practices-2-7`; преподавательские материалы и неудачные снимки DevTools не подменялись вымышленными доказательствами.

## Проверки

```powershell
cd booknest-web
npm run typecheck
npm run lint
npm test
npm run build
```

Все четыре команды завершаются с кодом 0. Реальные браузерные проверки Edge, отчёты Lighthouse, скриншоты и ограничения описаны в [docs/lab6b/README.md](docs/lab6b/README.md).

## Ограничения

- Каталог и обложки зависят от доступности Open Library; аварийные ответы 429/503 и некорректный JSON воспроизводятся контролируемыми моками и явно помечены в отчёте.
- Доступность означает `ebook_access:public`, а не наличие физического экземпляра BookNest.
- CRUD-адаптер формы учебный и локальный: backend отсутствует, записи сохраняются только для текущего origin.
- Форма выдачи `/loan` сохранена для совместимости и по-прежнему не отправляет данные на backend.
- Локальный AuthContext не выполняет реальную авторизацию; она относится к ЛР9.
- ЛР1–5 опубликованы отдельными PR. Ветка `lab-6b/router-forms` основана на `lab-6a/hooks` (`63053b8`); push и создание PR для ЛР6B не выполнялись.
